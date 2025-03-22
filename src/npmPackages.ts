import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function installAndImport(packageName: string, useLink = false) {
  try {
    await execAsync(`npm ${useLink ? "link" : "install"} ${packageName}`);
    const importedModule = await import(packageName);
    return importedModule;
  } catch (error) {

  }
}

export async function uninstall(packageName: string, useLink = false) {
    try {
      await execAsync(`npm ${useLink ? "unlink" : "rm"} ${packageName}`);
    } catch (error) {
    }
  }