import { request, gql } from "graphql-request"

export const retrieveBidsFromSubgraph = async (GRAPH_URL, BIDDER) => {
//Status "WON" 이라는 BIDDER 어드레스를 가진 node operator가 암호화된 validator key를 가져올수 있다는 의미이다.
//bids.pubKeyIndex 값을 가지고 내가 복호화해야 할 public key를 뽑아 낼 수 있을 것이다.
//validator.validatorPubKey는 Node operator가 IPFS에 upload해 놓은 키가 아닐까 싶다...
    const bidsQuery = gql`
    {
      bids(where: { bidderAddress: "${BIDDER}", status: "WON", validator_not: null, validator_: { phase: VALIDATOR_REGISTERED} }) {
        id
        bidderAddress
        pubKeyIndex
        validator {
            id
            phase
            ipfsHashForEncryptedValidatorKey
            validatorPubKey
        }
      }
    }
    `

    let bids = []
    try {
        const { bids: result } = await request(GRAPH_URL, bidsQuery)
        bids = result
    } catch (error) {
        console.error('an error occurred querying bids')
    }
    return bids
}
