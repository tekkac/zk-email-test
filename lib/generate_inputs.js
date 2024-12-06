const { generateEmailVerifierInputs, packBytesIntoNBytes } = require("@zk-email/helpers");

export async function generateCircuitInputs(rawEmail, inputs) {
    const circuitInputs = await generateEmailVerifierInputs(rawEmail, {
        ignoreBodyHashCheck: false,
        maxBodyLength: 54784,
        maxHeadersLength: 1472,
        shaPrecomputeSelector: "",
    },
    {
        domain: "nosgestesclimat.fr",
        fallbackToZKEmailDNSArchive: true,
    });

    const emailBodyString = circuitInputs.emailBody ? Buffer.from(circuitInputs.emailBody.map(Number)).toString('ascii') : null;
    const emailHeaderString = circuitInputs.emailHeader ? Buffer.from(circuitInputs.emailHeader.map(Number)).toString('ascii') : null;
    let regexInputs = {};
    
    {
    
        const match = emailBodyString.match(new RegExp("Votre empreinte carbone\\*\\* \\*\\*annuelle\\*\\* \\*\\*estim=C3=A9e\\*=\\r\\n\\* est de : \\*\\*"))
    
        if (match) {
            regexInputs = {
                ...regexInputs,
                tonnesRegexIdx: match.index + match[0].length
            }
        } else {
            throw new Error(`Did not find a match for tonnes in the email sample`)
        }
    }
    

    const packedInputs = {};

    

    return {
        ...circuitInputs,
        ...regexInputs,
        ...packedInputs
    }
}