using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;

[assembly: AssemblyTitle("TreeHugger Windows-Setup")]
[assembly: AssemblyProduct("TreeHugger")]
[assembly: AssemblyCompany("Gino Peduto")]

internal static class Setup
{
    const string Marker = ".treehugger-install";
    const string Signature = "TreeHugger Windows Setup 1";
    static readonly string DefaultRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TreeHugger");
    static string Version { get { return Assembly.GetExecutingAssembly().GetName().Version.ToString(3); } }

    [STAThread]
    static int Main(string[] args)
    {
        try
        {
            if (args.Length == 0)
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                ShowSetup();
                return 0;
            }
            if (args.Length != 2 || (args[0] != "--install" && args[0] != "--uninstall") || !Path.IsPathRooted(args[1])) return 2;
            Change(Path.GetFullPath(args[1]), args[0] == "--install");
            return 0;
        }
        catch (Exception error)
        {
            if (args.Length == 0) MessageBox.Show(error.Message, "TreeHugger", MessageBoxButtons.OK, MessageBoxIcon.Error);
            else Console.Error.WriteLine(error.Message);
            return 1;
        }
    }

    static void ShowSetup()
    {
        string target = Path.Combine(DefaultRoot, "Erweiterung");
        using (var form = new Form())
        {
            form.Text = "TreeHugger " + Version + " · Windows-Setup";
            form.Font = new Font("Segoe UI", 10);
            form.AutoScaleMode = AutoScaleMode.Dpi;
            form.StartPosition = FormStartPosition.CenterScreen;
            form.ClientSize = new Size(620, 322);
            form.FormBorderStyle = FormBorderStyle.FixedDialog;
            form.MaximizeBox = false;
            var heading = new Label { Text = "TreeHugger " + Version, Font = new Font("Segoe UI", 18, FontStyle.Bold), AutoSize = true, Location = new Point(22, 16) };
            var intro = new Label { Text = "DOM-Werkzeuge, Quiz und Klausurfragen für Google Chrome. Das Setup installiert die Dateien für Ihr Windows-Benutzerkonto.", AutoSize = false, Bounds = new Rectangle(25, 66, 565, 49) };
            var path = new TextBox { Text = target, ReadOnly = true, Bounds = new Rectangle(25, 116, 567, 32) };
            var status = new Label { Text = "Klicken Sie auf Installieren. Für die Aktivierung in Chrome steht anschließend die Anleitung bereit.", Bounds = new Rectangle(25, 158, 566, 64) };
            var install = new Button { Text = "Installieren", Bounds = new Rectangle(25, 242, 120, 38) };
            var help = new Button { Text = "Anleitung öffnen", Bounds = new Rectangle(154, 242, 150, 38) };
            var copy = new Button { Text = "Pfad kopieren", Bounds = new Rectangle(313, 242, 132, 38) };
            var remove = new Button { Text = "Entfernen", Bounds = new Rectangle(454, 242, 116, 38) };
            var controls = new Control[] {heading, intro, path, status, install, help, copy, remove};
            form.Controls.AddRange(controls);
            Action refresh = delegate {
                bool present = File.Exists(Path.Combine(target, Marker));
                remove.Enabled = present;
                help.Enabled = present && File.Exists(Path.Combine(target, "installation.html"));
                copy.Enabled = present;
            };
            Action<Action> run = task => {
                try { form.UseWaitCursor = true; task(); }
                catch (Exception e) { MessageBox.Show(form, e.Message, "TreeHugger", MessageBoxButtons.OK, MessageBoxIcon.Error); }
                finally { form.UseWaitCursor = false; refresh(); }
            };
            install.Click += delegate { run(delegate {
                Change(DefaultRoot, true);
                status.Text = "Installiert. Öffnen Sie chrome://extensions, aktivieren Sie den Entwicklermodus und wählen Sie bei „Entpackte Erweiterung laden“ den oben angegebenen Ordner.";
            }); };
            help.Click += delegate { run(delegate { Process.Start(new ProcessStartInfo(Path.Combine(target, "installation.html")) { UseShellExecute = true }); }); };
            copy.Click += delegate { run(delegate { Clipboard.SetText(target); status.Text = "Ordnerpfad kopiert. Fügen Sie ihn im Chrome-Dialog „Entpackte Erweiterung laden“ ein."; }); };
            remove.Click += delegate {
                if (MessageBox.Show(form, "Installierte Programmdateien entfernen? Falls Sie Klausurdaten benötigen, exportieren Sie vorher eine Sicherung.", "TreeHugger entfernen", MessageBoxButtons.YesNo) != DialogResult.Yes) return;
                run(delegate { Change(DefaultRoot, false); status.Text = "Programmdateien entfernt. Den Eintrag in Chrome können Sie unter chrome://extensions entfernen."; });
            };
            refresh();
            form.AcceptButton = install;
            form.ShowDialog();
        }
    }

    static void RejectLink(string path)
    {
        if ((File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0)
            throw new IOException("Verknüpfungen im Installationsordner können nicht verarbeitet werden: " + path);
    }

    static string Hash(Stream stream)
    {
        using (var sha = SHA256.Create())
            return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
    }

    static void ReadFiles(string directory, List<string> files)
    {
        RejectLink(directory);
        foreach (string path in Directory.EnumerateFileSystemEntries(directory))
        {
            RejectLink(path);
            if (Directory.Exists(path)) ReadFiles(path, files);
            else files.Add(path);
        }
    }

    static List<string> Inventory(string directory)
    {
        var files = new List<string>();
        ReadFiles(directory, files);
        var rows = new List<string> {Signature};
        foreach (string file in files.OrderBy(f => f, StringComparer.Ordinal))
        {
            string relative = file.Substring(directory.Length + 1);
            if (relative == Marker) continue;
            using (var stream = File.OpenRead(file)) rows.Add(Hash(stream) + "  " + relative);
        }
        return rows;
    }

    static void CheckOwned(string directory)
    {
        var actual = Inventory(directory);
        string marker = Path.Combine(directory, Marker);
        if (!File.Exists(marker) || !File.ReadAllLines(marker).SequenceEqual(actual))
            throw new IOException("Der Ordner enthält fremde oder veränderte Dateien. Sichern oder verschieben Sie ihn vor der Installation: " + directory);
    }

    static void Unpack(string stage)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using (var payload = assembly.GetManifestResourceStream("payload.zip"))
        using (var checksum = new StreamReader(assembly.GetManifestResourceStream("payload.sha256")))
        {
            if (Hash(payload) != checksum.ReadToEnd().Trim()) throw new InvalidDataException("Die Prüfsumme des Pakets stimmt nicht.");
            payload.Position = 0;
            using (var zip = new ZipArchive(payload, ZipArchiveMode.Read))
            foreach (var entry in zip.Entries)
            {
                string target = Path.GetFullPath(Path.Combine(stage, entry.FullName));
                if (!target.StartsWith(stage + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                    throw new InvalidDataException("Ungültiger Pfad im Paket.");
                if (entry.Name.Length == 0) { Directory.CreateDirectory(target); continue; }
                Directory.CreateDirectory(Path.GetDirectoryName(target));
                entry.ExtractToFile(target, false);
            }
        }
        File.WriteAllLines(Path.Combine(stage, Marker), Inventory(stage), Encoding.UTF8);
    }

    static void Change(string root, bool install)
    {
        string current = Path.Combine(root, "Erweiterung");
        string previous = Path.Combine(root, ".treehugger-vorher");
        if (!install && !Directory.Exists(root)) return;
        Directory.CreateDirectory(root);
        RejectLink(root);
        string lockPath = Path.Combine(root, ".treehugger-setup.lock");
        if (File.Exists(lockPath)) RejectLink(lockPath);
        using (new FileStream(lockPath, FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None, 1, FileOptions.DeleteOnClose))
        {
            if (Directory.Exists(previous))
            {
                CheckOwned(previous);
                if (!Directory.Exists(current)) Directory.Move(previous, current);
                else { CheckOwned(current); Directory.Delete(previous, true); }
            }
            if (Directory.Exists(current)) CheckOwned(current);
            if (!install)
            {
                if (Directory.Exists(current)) Directory.Delete(current, true);
                return;
            }

            string stage = Path.Combine(root, ".treehugger-neu-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(stage);
            try
            {
                Unpack(stage);
                if (Directory.Exists(current)) Directory.Move(current, previous);
                try { Directory.Move(stage, current); }
                catch
                {
                    if (Directory.Exists(previous) && !Directory.Exists(current)) Directory.Move(previous, current);
                    throw;
                }
                if (Directory.Exists(previous)) Directory.Delete(previous, true);
            }
            finally { if (Directory.Exists(stage)) Directory.Delete(stage, true); }
        }
    }
}
