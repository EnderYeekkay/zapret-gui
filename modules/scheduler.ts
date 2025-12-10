import { execSync } from 'child_process';
import { app, Notification } from 'electron/main';

const exePath = app.getPath('exe'); // Path to current executable
const launchArgs = '--tray'; // Flag for autostart

export function createTask(): boolean {
  if (checkTask()) {
    console.log(`Task "Guboril" already exists, skipping creation.`);
    return true;
  }

  try {
    console.log(`Creating task "Guboril" for autostart with flag "${launchArgs}"...`);
    const cmd = `schtasks /Create /TN "Guboril" /TR "\\"${exePath}\\" ${launchArgs}" /SC ONLOGON /RL HIGHEST`;
    execSync(cmd);
  } catch (err: any) {
    if (err instanceof Error) {
      new Notification({title: 'Не удалось добавить в автозапуск!', body: err.stack})
      console.error('Failed to create task:', err.message);
    }
  } finally {
    console.log('Task created successfully!');
    return true;
  }
}

export function deleteTask(): boolean {
  try {
    console.log(`Deleting task "Guboril"...`);
    const cmd = `schtasks /Delete /TN "Guboril" /F`;
    execSync(cmd);
  } catch (err: any) {
    if (err instanceof Error) {
      new Notification({title: 'Не удалось удалить из автозапуска!', body: err.stack})
      console.error('Failed to delete task:', err.message);
    }
    return false;
  } finally {
    console.log('Task deleted successfully!');
    return true;
  }
}

export function checkTask(): boolean {
  try {
    const cmd = `schtasks /Query /TN "Guboril"`;
    execSync(cmd);
    return true;
  } catch {
    return false;
  }
}
