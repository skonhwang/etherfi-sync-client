## source 분석은 여기부터
### src/cron-detect.js
```
 24   for (const bid of bids) {
 25     console.log(`> start processing bid with id:${bid.id}`)
 26     const { validator, pubKeyIndex } = bid
 27     const { ipfsHashForEncryptedValidatorKey, validatorPubKey } = validator
 28     const file = await fetchFromIpfs(ipfsHashForEncryptedValidatorKey)
 29     const validatorKey = decryptKeyPairJSON(privateKeys, PASSWORD)
 30     const { pubKeyArray, privKeyArray } = validatorKey
 31     const keypairForIndex = getKeyPairByPubKeyIndex(pubKeyIndex, privKeyArray, pubKeyArray)
 32     const data = decryptValidatorKeyInfo(file, keypairForIndex)
 33     console.log(`creating ${data.keystoreName} for bid:${bid.id}`)
 34     createFSBidOutput(OUTPUT_LOCATION, data, bid.id, validatorPubKey)
 35     console.log(`< end processing bid with id:${bid.id}`)
 36   }
```

## EtherFi Sync Client

### Local development

To get setup, run the following:
- `nvm use` to select the correct node version
- `yarn` to install depedencies
- `cp .env.example .env` to get a working .env setup for testing

You should now be ready to run the program:
- `yarn start` or `node index.js`


### Docker usage

Prepare a .env that suits your environment, you will need to configure:
- ETHERFI_SC_BIDDER, the address used in the web UI to create bids
- ETHERFI_SC_PASSWORD, the password used when generating the keys with the desktop app
- ETHERFI_SC_PRIVATE_KEYS_FILE_LOCATION, the location of the private keys generated with the desktop app

Build the image with `docker build . -t etherfi-sync-client:0.0.1` or `docker build . -t etherfi-sync-client:latest`.
  --> 빌드하는 명령어로, 만약 소스코드를 수정했거나 혹은 이름이 0.0.1, latest보다 다른 이름을 지정하고 싶으면 여기를 자유롭게 바꾸면 된다.
  --> `docker build . -t etherfi-sync-client:XXX`

To run the image as a container, use `docker run --env-file .env etherfi-sync-client:0.0.1` or `docker run --env-file .env etherfi-sync-client:latest`.


### Docker compose usage

Create a `storage directory` with two sub directories, `input` & `output`.
In the `input` directory include the keys generated from desktop app for NO.
- privateEtherfiKeystore-1681395800316.json
- publicEtherfiKeystore-1681395800301.json
- --> etherfi-deskop을 통해 만들어지는 key로 bidding 후에 validator key를 decrypt하기 위한 것이다. privateEtherfiKeystore-xxx.json과 publicEtherfiKeystore-XXX.json은 한개씩만 생기기 때문에 이부분을 위해 소스코드를 수정해야 할 것은 없어보인다.

Ensure environment is correct for variables:
- ETHERFI_SC_IPFS_GATEWAY (probably ok)
- ETHERFI_SC_GRAPH_URL (probably ok)
- ETHERFI_SC_OUTPUT_LOCATION (probably ok)
- ETHERFI_SC_BIDDER (most likely to change)
- ETHERFI_SC_PRIVATE_KEYS_FILE_LOCATION (most likely to change)
- ETHERFI_SC_PASSWORD (most likely to change)

Run locally to iterate on code with `docker compose up --build` which will rebuild everything each time.

Run on ec2 instance by creating tar and shipping via scp to ec2, with:
- local machine `tar --exclude="node_modules" --exclude="storage/output" --exclude=".git" -czvf sync-client.tar.gz etherfi-sync-client`
- local machine `scp -i etherfi-staking.pem sync-client.tar.gz ec2-user@ec2-52-221-193-254.ap-southeast-1.compute.amazonaws.com:/home/ec2-user/ethereum/consensus/`
- ec2 instance `tar -xzvf sync-client.tar.gz`
- ec2 instance `rm sync-client.tar.gz`
- ec2 instance `cd etherfi-sync-client`
- ec2 instance `docker-compose up -d --build`
- ec2 instance, once keys are populated into `storage/out/XXX`, go into each and run script to add key to prysm.

### Future potential improvements

- cleanup how .env and env variables are used in general
- detect private key file in directory at ETHERFI_SC_PRIVATE_KEYS_FILE_LOCATION instead of needing to specify exact file, although it creates bigger error surface, so might not be best idea, just a PITA when doing multiple tests where different files are being used, but not a biggie
- run something along the lines of "sudo ./prysm.sh validator accounts list --goerli --wallet-dir=/home/ec2-user/ethereum/consensus" programmatically and record output, compare with validators on subgraph and check that all states match
- fuckit, make whole app a golang binary instead, more powerful and more portable, only downside is amount of developers that know golang, so bus factor increases a bit


### Useful commands

Run the following from the directory `/home/ec2-user/ethereum/consensus`

- List accounts `sudo ./prysm.sh validator accounts list --goerli --wallet-dir=/home/ec2-user/ethereum/consensus` (password = fakepassbro)
- Import new keystore `sudo ./prysm.sh validator accounts import --goerli --wallet-dir=/home/ec2-user/ethereum/consensus --keys-dir=/home/ec2-user/ethereum/consensus/validator_keys/keystore-m_12381_3600_0_0_0-1681300318.json`

The above commands are also found in easy to use scripts in the `/staking-scripts` directory

### Good docs to read for more understanding

https://docs.prylabs.network/docs/how-prysm-works/validator-lifecycle

https://docs.prylabs.network/docs/wallet/nondeterministic
