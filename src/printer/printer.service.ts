import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface PrinterStatusResponse {
  connected: boolean;
  name: string;
  port: string;
  isDefault: boolean;
  driverName?: string;
  message?: string;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);

  async getStatus(): Promise<PrinterStatusResponse> {
    try {
      const psCommand = `
        $printer = Get-CimInstance Win32_Printer | Where-Object { $_.Name -like '*TD110*' -or $_.Name -like '*Blueprint*' } | Select-Object -First 1 Name, PortName, DriverName, Default
        if ($printer) {
          [PSCustomObject]@{
            connected = $true
            name = $printer.Name
            port = $printer.PortName
            driverName = $printer.DriverName
            isDefault = [bool]$printer.Default
          } | ConvertTo-Json -Compress
        } else {
          [PSCustomObject]@{
            connected = $false
            name = 'Blueprint BP-TD110D'
            port = 'USB001'
            driverName = '-'
            isDefault = $false
            message = 'Printer Blueprint TD110D tidak ditemukan di sistem Windows'
          } | ConvertTo-Json -Compress
        }
      `;

      const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', psCommand]);
      const data = JSON.parse(stdout.trim());
      return data;
    } catch (err: any) {
      this.logger.error('Failed to get printer status', err);
      return {
        connected: false,
        name: 'Blueprint BP-TD110D',
        port: 'USB001',
        isDefault: false,
        message: err.message,
      };
    }
  }

  async testPrint(): Promise<{ success: boolean; message: string }> {
    try {
      const psCommand = `
        $text = @"
========================================
       POSKETREN NURUL JADID
    UJI CETAK PRINTER THERMAL
========================================
Printer : Blueprint BP-TD110D
Port    : USB001
Kertas  : 100 x 150 mm / A6
Waktu   : $(Get-Date -Format 'dd-MM-yyyy HH:mm:ss')
========================================
   STATUS: TERKONEKSI KE APLIKASI
   SIAP MENCETAK RESI SECARA LANGSUNG
========================================
"@
        $text | Out-Printer -Name 'Blueprint BP-TD110D'
      `;

      await execFileAsync('powershell.exe', ['-NoProfile', '-Command', psCommand]);
      return { success: true, message: 'Perintah uji cetak berhasil dikirim langsung ke Blueprint BP-TD110D!' };
    } catch (err: any) {
      this.logger.error('Failed to test print', err);
      return { success: false, message: `Gagal cetak: ${err.message}` };
    }
  }

  async setDefault(): Promise<{ success: boolean; message: string }> {
    try {
      const psCommand = `
        (New-Object -ComObject WScript.Network).SetDefaultPrinter('Blueprint BP-TD110D')
        Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows' -Name 'LegacyDefaultPrinterMode' -Value 1 -Type DWord
      `;
      await execFileAsync('powershell.exe', ['-NoProfile', '-Command', psCommand]);
      return { success: true, message: 'Blueprint BP-TD110D berhasil dikonfigurasi sebagai Default Printer Windows' };
    } catch (err: any) {
      this.logger.error('Failed to set default printer', err);
      return { success: false, message: err.message };
    }
  }
}

