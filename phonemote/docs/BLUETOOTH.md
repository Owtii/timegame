# Bluetooth

## The honest answer

A web page on a phone cannot present itself as a Bluetooth controller. Web
Bluetooth only supports the *central* role — a page can connect **to** a
Bluetooth device, scan it, read and write its characteristics. The *peripheral*
role, where the phone advertises itself as, say, an HID gamepad that a computer
pairs with, is not part of the API on any browser, on any platform. That is a
deliberate limitation, not a gap waiting to be filled.

So there is no version of this project where you scan a QR code and your phone
shows up in your computer's Bluetooth settings as a game controller. That needs
a native app (and on iOS, entitlements Apple does not hand out for this).

## What does work: Bluetooth tethering (PAN)

Bluetooth can still carry the connection — just at the IP layer instead of the
HID layer. Turn on your phone's Bluetooth tethering and the phone and computer
share a small private network over Bluetooth. phonemote then runs over that
exactly as it does over WiFi, because all it needs is an IP route.

This is genuinely useful when:

- there is no WiFi network to share, or
- the WiFi has client isolation turned on (most guest and hotel networks), which
  blocks phone-to-laptop traffic even though both have internet.

Latency is higher than WiFi — expect roughly 20–40 ms of round trip against 3–10
ms on a decent WiFi network — and Bluetooth PAN tops out around 1 Mbit/s, which
is far more than the ~60 kbit/s a controller stream needs. Pointing still feels
fine. Fast swings are where you will notice the difference.

### Android phone, any computer

1. On the phone: **Settings → Network & internet → Hotspot & tethering →
   Bluetooth tethering**, on.
2. Pair the phone and the computer over Bluetooth, if they are not already.
3. On the computer, join the phone's Bluetooth network:
   - **Windows**: Bluetooth settings → **Devices and printers** → right-click the
     phone → **Connect using → Access point**.
   - **Linux**: `nmcli` or your desktop's Bluetooth panel → the phone → *Network
     Access Point*. On the command line:
     `nmcli connection add type bluetooth bt-type panu ifname '*' con-name phone bdaddr AA:BB:CC:DD:EE:FF`
   - **macOS**: Bluetooth menu → the phone → **Connect to Network**.
4. Run `npm start` and look at the address list it prints. There will be a new
   one on the Bluetooth interface, usually `192.168.44.x` (Android) — open
   `https://<that address>:8443/c` on the phone.

### iPhone

iOS does not offer Bluetooth PAN to arbitrary computers the way Android does;
Personal Hotspot over Bluetooth works but is bound to your carrier plan and
often disabled. USB is the better fallback there — see below.

### USB, which is better than both

If you have a cable, use it. It is lower latency than either radio and it charges
the phone while you play.

- **Android**: **Settings → Hotspot & tethering → USB tethering**. The computer
  gets a new network interface; phonemote's address list will include it.
- **iPhone**: plug in, trust the computer, and the phone appears as a network
  interface on macOS and on Windows with iTunes installed.

Either way the flow is the same: start the server, look at the printed
addresses, and open the one that belongs to the new interface.

## Why not just use the LAN?

Usually you should. WiFi on a normal home network is the lowest-friction and
lowest-latency option, and it is what the QR code in the terminal points at.
Reach for Bluetooth or USB when the network is not cooperating.
