pragma circom 2.1.6;
include "@zk-email/circuits/email-verifier.circom";
include "@zk-email/circuits/utils/regex.circom";
// regex-sdk currently does not support directly generating the regex for to and from address
include "@zk-email/zk-regex-circom/circuits/common/from_addr_regex.circom";
include "@zk-email/zk-regex-circom/circuits/common/to_addr_regex.circom";


include "./regex/tonnesRegex.circom";


template footprint(maxHeaderLength, maxBodyLength, n, k, packSize) {
    assert(n * k > 1024); // constraints for 1024 bit RSA

    signal input emailHeader[maxHeaderLength]; // prehashed email data, includes up to 512 + 64? bytes of padding pre SHA256, and padded with lots of 0s at end after the length
    signal input emailHeaderLength;
    signal input pubkey[k]; // rsa pubkey, verified with smart contract + DNSSEC proof. split up into k parts of n bits each.
    signal input signature[k]; // rsa signature. split up into k parts of n bits each.

    


    // DKIM Verification
    component EV = EmailVerifier(maxHeaderLength, maxBodyLength, n, k, 0);
    EV.emailHeader <== emailHeader;
    EV.emailHeaderLength <== emailHeaderLength;
    EV.pubkey <== pubkey;
    EV.signature <== signature;

     
    signal input bodyHashIndex;
    signal input precomputedSHA[32];
    signal input emailBody[maxBodyLength];
    signal input emailBodyLength;

    EV.bodyHashIndex <== bodyHashIndex;
    EV.precomputedSHA <== precomputedSHA;
    EV.emailBody <== emailBody;
    EV.emailBodyLength <== emailBodyLength;
    

    signal output pubkeyHash;
    pubkeyHash <== EV.pubkeyHash;

    // Used for nullifier later
    signal headerHash[256] <== EV.sha;


    // TONNES Extraction
    signal input tonnesRegexIdx;
    var tonnesMaxLength = 8;
    signal tonnesRegexOut, tonnesRegexReveal[maxBodyLength];

    (tonnesRegexOut, tonnesRegexReveal) <== tonnesRegex(maxBodyLength)(emailBody);

    tonnesRegexOut === 1;

    signal output tonnesPackedOut[computeIntChunkLength(tonnesMaxLength)];
    tonnesPackedOut <== PackRegexReveal(maxBodyLength, tonnesMaxLength)(tonnesRegexReveal, tonnesRegexIdx);


}


component main = footprint(1472, 54784, 121, 17, 7);
