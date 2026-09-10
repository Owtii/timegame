import { spawn, execFileSync } from 'node:child_process';

/**
 * Optional: drive the real desktop cursor from the pointer, so the phone works
 * as an air mouse outside the browser. This leans on whatever CLI the platform
 * already has rather than a native addon, so it stays install-free — and
 * degrades to a no-op with one warning when the tool is missing.
 *
 *   Linux  : xdotool (reads a command stream on stdin, so one long-lived child)
 *   Windows: powershell (same trick, a loop reading stdin)
 *   macOS  : cliclick (one short-lived child per move, throttled harder)
 */
export function createMouse({ screen = null, log = console.log } = {}) {
  const platform = process.platform;
  const size = parseScreen(screen) || detectScreen(platform) || { w: 1920, h: 1080 };
  let child = null;
  let alive = true;
  let lastMove = 0;
  let pending = null;
  let pendingTimer = null;
  const minInterval = platform === 'darwin' ? 33 : 8;

  const disable = (why) => {
    if (!alive) return;
    alive = false;
    log(`  virtual mouse disabled: ${why}`);
  };

  function stream() {
    if (!alive || child) return child;
    try {
      if (platform === 'linux') {
        child = spawn('xdotool', ['-'], { stdio: ['pipe', 'ignore', 'ignore'] });
      } else if (platform === 'win32') {
        child = spawn('powershell', ['-NoProfile', '-Command', WIN_LOOP], {
          stdio: ['pipe', 'ignore', 'ignore'],
        });
      }
    } catch (err) {
      disable(err.message);
      return null;
    }
    if (child) {
      child.on('error', (err) => disable(`${err.code === 'ENOENT' ? 'helper not found' : err.message}`));
      child.on('exit', () => { child = null; });
    }
    return child;
  }

  function write(line) {
    const c = stream();
    if (!c || !c.stdin.writable) return;
    c.stdin.write(line + '\n');
  }

  function moveAbs(x, y) {
    if (platform === 'darwin') {
      run('cliclick', [`m:${x},${y}`]);
    } else if (platform === 'win32') {
      write(`${x} ${y}`);
    } else {
      write(`mousemove ${x} ${y}`);
    }
  }

  function run(cmd, args) {
    try {
      const c = spawn(cmd, args, { stdio: 'ignore' });
      c.on('error', (err) => disable(err.code === 'ENOENT' ? `${cmd} not installed` : err.message));
    } catch (err) {
      disable(err.message);
    }
  }

  return {
    get enabled() { return alive; },
    screen: size,

    /** @param {number} nx 0..1 @param {number} ny 0..1 */
    move(nx, ny) {
      if (!alive) return;
      const x = Math.round(clamp01(nx) * (size.w - 1));
      const y = Math.round(clamp01(ny) * (size.h - 1));
      const now = Date.now();
      const wait = minInterval - (now - lastMove);
      if (wait > 0) {
        // Coalesce: only the newest position matters, so overwrite and wait.
        pending = [x, y];
        if (!pendingTimer) {
          pendingTimer = setTimeout(() => {
            pendingTimer = null;
            if (!pending) return;
            lastMove = Date.now();
            moveAbs(pending[0], pending[1]);
            pending = null;
          }, wait);
          pendingTimer.unref?.();
        }
        return;
      }
      lastMove = now;
      pending = null;
      moveAbs(x, y);
    },

    click(button = 1, down = null) {
      if (!alive) return;
      if (platform === 'darwin') {
        if (down === false) return; // cliclick has no press/release split we need
        run('cliclick', [button === 3 ? 'rc:.' : 'c:.']);
      } else if (platform === 'win32') {
        write(`click ${button} ${down === false ? 'up' : 'down'}`);
      } else if (down === null) {
        write(`click ${button}`);
      } else {
        write(`${down ? 'mousedown' : 'mouseup'} ${button}`);
      }
    },

    scroll(amount) {
      if (!alive || platform !== 'linux') return;
      const button = amount < 0 ? 4 : 5;
      for (let i = 0; i < Math.min(5, Math.abs(Math.round(amount))); i++) write(`click ${button}`);
    },

    close() {
      alive = false;
      if (pendingTimer) clearTimeout(pendingTimer);
      child?.stdin.end();
      child?.kill();
    },
  };
}

const WIN_LOOP = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -Namespace PM -Name Native -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, int e);'
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($line -eq $null) { break }
  $p = $line.Split(' ')
  if ($p[0] -eq 'click') {
    $flag = if ($p[2] -eq 'up') { 0x4 } else { 0x2 }
    if ($p[1] -eq '3') { $flag = if ($p[2] -eq 'up') { 0x10 } else { 0x8 } }
    [PM.Native]::mouse_event($flag, 0, 0, 0, 0)
  } elseif ($p.Length -ge 2) {
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$p[0], [int]$p[1])
  }
}`;

function parseScreen(s) {
  const m = /^(\d+)\s*[xX*]\s*(\d+)$/.exec(String(s || ''));
  return m ? { w: +m[1], h: +m[2] } : null;
}

function detectScreen(platform) {
  try {
    if (platform === 'linux') {
      const out = execFileSync('xdotool', ['getdisplaygeometry'], { encoding: 'utf8' });
      const [w, h] = out.trim().split(/\s+/).map(Number);
      if (w && h) return { w, h };
    }
  } catch {
    // detection is best effort; the caller falls back to 1080p
  }
  return null;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
