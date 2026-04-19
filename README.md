# Cipher CLI

Neural Synthesis AI Assistant - Command Line Interface

## Quick Install

### macOS / Linux
```bash
curl -sL https://raw.githubusercontent.com/vatistasdimitris01/cipher-cli/main/install.sh | bash
```

### Windows (PowerShell as Admin)
```powershell
irm https://raw.githubusercontent.com/vatistasdimitris01/cipher-cli/main/install.ps1 | iex
```

### Or manually
```bash
git clone https://github.com/vatistasdimitris01/cipher-cli.git
cd cipher-cli
npm install -g .
```

## Commands

| Command | Description |
|---------|-------------|
| `cipher login` | Get link code and authenticate |
| `cipher verify <code>` | Verify a code manually |
| `cipher chat <msg>` | Send a message |
| `cipher whoami` | Show current user |
| `cipher logout` | Log out |

## Usage

```bash
# Login - get a verification code
cipher login
# Shows: Your link code: CIPH-XXXX

# Visit: https://ciphertheai.vercel.app/auth?code=CIPH-XXXX
# Sign in with Google, click "Confirm"

# CLI automatically verifies and saves credentials!

# Now chat
cipher chat "hello, write a python hello world"

# Or verify manually if login times out
cipher verify CIPH-XXXX
```

## Requirements

- Node.js 18+
- Internet connection

## Web App

Use the web interface: https://ciphertheai.vercel.app

## License

MIT