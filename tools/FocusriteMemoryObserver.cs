using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace FocusriteDiagnostics
{
    public sealed class MemoryFrameEvidence
    {
        public string Root { get; set; }
        public string[] Attributes { get; set; }
        public string[] CoreIds { get; set; }
        public int Count { get; set; }
    }

    public sealed class MemoryScanResult
    {
        public int ProcessesAttempted { get; set; }
        public int ProcessesScanned { get; set; }
        public bool ScanLimitReached { get; set; }
        public MemoryFrameEvidence[] Frames { get; set; }
    }

    public static class MemoryObserver
    {
        private const uint PROCESS_QUERY_INFORMATION = 0x0400;
        private const uint PROCESS_VM_READ = 0x0010;
        private const uint MEM_COMMIT = 0x1000;
        private const uint MEM_IMAGE = 0x1000000;
        private const uint PAGE_GUARD = 0x100;
        private const uint PAGE_NOACCESS = 0x01;
        private const int MAX_CHUNK = 1024 * 1024;
        private const int MAX_FRAME = 2 * 1024 * 1024;
        private const long MAX_TOTAL_BYTES = 512L * 1024L * 1024L;
        private const int MAX_FRAMES = 5000;

        private static readonly HashSet<string> CoreIds = new HashSet<string>(new[] {
            "1259","1260","1261","1266","1267","1268","1273","1274","1279","1280",
            "1285","1286","1291","1292","1297","1298","1303","1304","1678","1679","1682"
        });
        private static readonly Regex RootRx = new Regex(@"^\s*<([A-Za-z][A-Za-z0-9-]{0,63})\b", RegexOptions.Compiled);
        private static readonly Regex AttrRx = new Regex(@"\s([A-Za-z_:][A-Za-z0-9_.:-]{0,63})\s*=", RegexOptions.Compiled);
        private static readonly Regex ItemRx = new Regex(@"<item\b[^>]{0,512}\bid=[\"'](\d{1,6})[\"']", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        [StructLayout(LayoutKind.Sequential)]
        private struct MEMORY_BASIC_INFORMATION
        {
            public IntPtr BaseAddress;
            public IntPtr AllocationBase;
            public uint AllocationProtect;
            public UIntPtr RegionSize;
            public uint State;
            public uint Protect;
            public uint Type;
        }

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(uint access, bool inheritHandle, int processId);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool ReadProcessMemory(IntPtr process, IntPtr baseAddress, byte[] buffer, UIntPtr size, out UIntPtr bytesRead);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern UIntPtr VirtualQueryEx(IntPtr process, IntPtr address, out MEMORY_BASIC_INFORMATION info, UIntPtr length);

        [DllImport("kernel32.dll")]
        private static extern bool CloseHandle(IntPtr handle);

        private static bool IsReadable(MEMORY_BASIC_INFORMATION mbi)
        {
            if (mbi.State != MEM_COMMIT || mbi.Type == MEM_IMAGE) return false;
            if ((mbi.Protect & PAGE_GUARD) != 0 || (mbi.Protect & PAGE_NOACCESS) != 0) return false;
            uint p = mbi.Protect & 0xff;
            return p == 0x02 || p == 0x04 || p == 0x08 || p == 0x20 || p == 0x40 || p == 0x80;
        }

        private static int HexValue(byte b)
        {
            if (b >= (byte)'0' && b <= (byte)'9') return b - (byte)'0';
            if (b >= (byte)'A' && b <= (byte)'F') return b - (byte)'A' + 10;
            if (b >= (byte)'a' && b <= (byte)'f') return b - (byte)'a' + 10;
            return -1;
        }

        private static bool TryFrameLength(byte[] data, int i, out int length)
        {
            length = 0;
            if (i < 0 || i + 14 > data.Length) return false;
            if (data[i] != 'L' || data[i+1] != 'e' || data[i+2] != 'n' || data[i+3] != 'g' || data[i+4] != 't' || data[i+5] != 'h' || data[i+6] != '=') return false;
            int value = 0;
            for (int x = 0; x < 6; x++) {
                int h = HexValue(data[i + 7 + x]);
                if (h < 0) return false;
                value = (value << 4) | h;
            }
            if (data[i + 13] != (byte)' ' || value <= 0 || value > MAX_FRAME) return false;
            length = value;
            return true;
        }

        private static byte[] ReadExact(IntPtr process, ulong address, int length)
        {
            var buffer = new byte[length];
            UIntPtr read;
            if (!ReadProcessMemory(process, new IntPtr(unchecked((long)address)), buffer, (UIntPtr)(ulong)length, out read)) return null;
            if ((ulong)read != (ulong)length) return null;
            return buffer;
        }

        private static void AddFrame(Dictionary<string, MemoryFrameEvidence> grouped, HashSet<string> fingerprints, byte[] frame)
        {
            if (frame == null || frame.Length < 15) return;
            string fingerprint;
            using (var sha = SHA256.Create()) fingerprint = Convert.ToBase64String(sha.ComputeHash(frame));
            if (!fingerprints.Add(fingerprint)) return;

            int payloadLength;
            if (!TryFrameLength(frame, 0, out payloadLength) || 14 + payloadLength > frame.Length) return;
            string xml;
            try { xml = Encoding.UTF8.GetString(frame, 14, payloadLength); } catch { return; }
            var rootMatch = RootRx.Match(xml);
            if (!rootMatch.Success) return;
            string root = rootMatch.Groups[1].Value.ToLowerInvariant();
            int openEnd = xml.IndexOf('>');
            if (openEnd < 0 || openEnd > 4096) return;
            var attrs = AttrRx.Matches(xml.Substring(0, openEnd + 1)).Cast<Match>()
                .Select(m => m.Groups[1].Value.ToLowerInvariant()).Distinct().OrderBy(x => x).ToArray();
            var core = new SortedSet<string>(Comparer<string>.Create((a,b) => int.Parse(a).CompareTo(int.Parse(b))));
            if (root == "set") {
                foreach (Match m in ItemRx.Matches(xml)) if (CoreIds.Contains(m.Groups[1].Value)) core.Add(m.Groups[1].Value);
            }
            string key = root + "|" + string.Join(",", attrs) + "|" + string.Join(",", core);
            MemoryFrameEvidence ev;
            if (!grouped.TryGetValue(key, out ev)) {
                ev = new MemoryFrameEvidence { Root = root, Attributes = attrs, CoreIds = core.ToArray(), Count = 0 };
                grouped[key] = ev;
            }
            ev.Count++;
        }

        private static bool ScanProcess(int processId, Dictionary<string, MemoryFrameEvidence> grouped, HashSet<string> fingerprints, ref long totalBytes, ref bool limitReached)
        {
            IntPtr process = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, processId);
            if (process == IntPtr.Zero) return false;
            try {
                ulong address = 0;
                UIntPtr mbiSize = (UIntPtr)(ulong)Marshal.SizeOf(typeof(MEMORY_BASIC_INFORMATION));
                while (address < 0x00007fffffffffffUL && totalBytes < MAX_TOTAL_BYTES && fingerprints.Count < MAX_FRAMES) {
                    MEMORY_BASIC_INFORMATION mbi;
                    UIntPtr queried = VirtualQueryEx(process, new IntPtr(unchecked((long)address)), out mbi, mbiSize);
                    if (queried == UIntPtr.Zero) break;
                    ulong baseAddr = unchecked((ulong)mbi.BaseAddress.ToInt64());
                    ulong regionSize = mbi.RegionSize.ToUInt64();
                    ulong next = baseAddr + regionSize;
                    if (next <= address) break;
                    if (IsReadable(mbi) && regionSize > 0) {
                        ulong offset = 0;
                        while (offset < regionSize && totalBytes < MAX_TOTAL_BYTES && fingerprints.Count < MAX_FRAMES) {
                            int len = (int)Math.Min((ulong)MAX_CHUNK, regionSize - offset);
                            byte[] chunk = ReadExact(process, baseAddr + offset, len);
                            if (chunk != null) {
                                totalBytes += chunk.Length;
                                for (int i = 0; i + 14 <= chunk.Length; i++) {
                                    int payloadLen;
                                    if (!TryFrameLength(chunk, i, out payloadLen)) continue;
                                    int frameLen = 14 + payloadLen;
                                    byte[] frame = null;
                                    if (i + frameLen <= chunk.Length) {
                                        frame = new byte[frameLen];
                                        Buffer.BlockCopy(chunk, i, frame, 0, frameLen);
                                    } else {
                                        frame = ReadExact(process, baseAddr + offset + (ulong)i, frameLen);
                                    }
                                    AddFrame(grouped, fingerprints, frame);
                                }
                            }
                            offset += (ulong)len;
                        }
                    }
                    address = next;
                }
                if (totalBytes >= MAX_TOTAL_BYTES || fingerprints.Count >= MAX_FRAMES) limitReached = true;
                return true;
            } finally { CloseHandle(process); }
        }

        public static MemoryScanResult Scan(int[] processIds)
        {
            var ids = (processIds ?? new int[0]).Where(id => id > 0).Distinct().Take(8).ToArray();
            var grouped = new Dictionary<string, MemoryFrameEvidence>(StringComparer.Ordinal);
            var fingerprints = new HashSet<string>(StringComparer.Ordinal);
            long totalBytes = 0;
            bool limitReached = false;
            int scanned = 0;
            foreach (int id in ids) {
                if (ScanProcess(id, grouped, fingerprints, ref totalBytes, ref limitReached)) scanned++;
                if (limitReached) break;
            }
            return new MemoryScanResult {
                ProcessesAttempted = ids.Length,
                ProcessesScanned = scanned,
                ScanLimitReached = limitReached,
                Frames = grouped.Values.OrderBy(x => x.Root).ThenBy(x => string.Join(",", x.Attributes)).ToArray()
            };
        }
    }
}
