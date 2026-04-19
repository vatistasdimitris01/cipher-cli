# Cipher CLI

Neural Synthesis AI Assistant - Command Line Interface

## Quick Install

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/cipher-cli.git
cd cipher-cli

# Install globally
npm install -g .

# Or use without installing
npx cipher-cli chat "hello"
```

## Commands

| Command | Description |
|---------|-------------|
| `cipher login` | Get link code and authenticate |
| `cipher verify <code>` | Verify a code (from web) |
| `cipher chat <msg>` | Send a message |
| `cipher whoami` | Show current user |
| `cipher logout` | Log out |

## Usage

```bash
# Login - get a code
cipher login
# Shows: CIPH-XXXX

# Visit https://ciphertheai.vercel.app/auth?code=CIPH-XXXX
# Sign in with Google, click Confirm

# CLI auto-verifies and saves credentials!

# Now chat
cipher chat "write a hello world in python"

# Or verify manually if login times out
cipher verify CIPH-XXXX
```

## Development

```bash
# Run locally
npm install
npx tsx cli.ts login
```

## License

MIT
