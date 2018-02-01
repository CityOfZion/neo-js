const profiles = {
  Wallets: {
    WalletA: {
      Address: 'ALq7AWrhAueN6mJNqk6FHJjnsEoPRytLdW',
      PrivateKey: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
      PublicKey: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
      Wif: 'L1QqQJnpBwbsPGAuutuzPTac8piqvbR1HRjrY5qHup48TBCBFe4g',
      Passphrase: 'city of zion',
      EncryptedWif: '6PYLHmDf6AjF4AsVtosmxHuPYeuyJL3SLuw7J1U8i7HxKAnYNsp61HYRfF'
    },
    WalletB: {
      Address: 'ALfnhLg7rUyL6Jr98bzzoxz5J7m64fbR4s',
      PrivateKey: '9ab7e154840daca3a2efadaf0df93cd3a5b51768c632f5433f86909d9b994a69',
      PublicKey: '031d8e1630ce640966967bc6d95223d21f44304133003140c3b52004dc981349c9',
      Wif: 'L2QTooFoDFyRFTxmtiVHt5CfsXfVnexdbENGDkkrrgTTryiLsPMG',
      Passphrase: '我的密码',
      EncryptedWif: '6PYWVp3xfgvnuNKP7ZavSViYvvim2zuzx9Q33vuWZr8aURiKeJ6Zm7BfPQ'
    },
    WalletC: {
      Address: 'AVf4UGKevVrMR1j3UkPsuoYKSC4ocoAkKx',
      PrivateKey: '3edee7036b8fd9cef91de47386b191dd76db2888a553e7736bb02808932a915b',
      PublicKey: '02232ce8d2e2063dce0451131851d47421bfc4fc1da4db116fca5302c0756462fa',
      Wif: 'KyKvWLZsNwBJx5j9nurHYRwhYfdQUu9tTEDsLCUHDbYBL8cHxMiG',
      Passphrae: 'MyL33tP@33w0rd',
      EncryptedWif: '6PYNoc1EG5J38MTqGN9Anphfdd6UwbS4cpFCzHhrkSKBBbV1qkbJJZQnkn'
    },
    WalletN: {
      Address: 'Adii5po62hCCS9s9upsK6bXdWJosjHBt4G',
      Hash: '0x869575db91de0265118002f26e00fe1d4a89b9f0'
    }
  },
  Assets: {
    Neo: '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b',
    Gas: '0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7'
  },
  Contracts: {
    RPX: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
    RPX_Test: '0x5b7074e873973a6ed3708862f219a6fbf4d1c411',
    LOCALTOKEN_Test: '0xd7678dd97c000be3f33e9362e673101bac4ca654'
  },
  Blocks: {
    Block_100000: {
      Number: 100000,
      Hash: '0xd60d44b5bcbb84d732fcfc31397b81c4e21c7300b9627f890b0f75c863f0c122',
      Transactions: [
        {
          Hash: '0x40c2a24c32271210b1aa1e89c938494312d4b1dd0315ee8dad2a52b4e66d8042',
          Size: 10,
          Type: 'MinerTransaction',
          Nounce: 1584347482
        }
      ]
    },
    Block_608999: {
      Number: 608999,
      Hash: '0x0c3340cfdb226d6da46afe26de14b2cb2c8913a3814bec23e5e40a598d5c4078',
      Transactions: [
        {
          Hash: '0x5f3220532e3811ed49831eb2209b2fac49bbeaa61d2a29abb191fb3628348c5b',
          Size: 10,
          Type: 'MinerTransaction',
          Nounce: 3774638267
        },
        {
          Hash: '0xc8fbc56acdbfa03f9eacb06e28c29dfd30af61255bd0f51f88851900bcd75937',
          Size: 262,
          Type: 'ContractTransaction'
        }
      ]
    }
  }
}

module.exports = profiles
