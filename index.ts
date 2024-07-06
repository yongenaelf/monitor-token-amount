import AElf from "aelf-sdk";
import BigNumber from "bignumber.js";

const aelf = new AElf(
  new AElf.providers.HttpProvider("https://aelf-test-node.aelf.io")
);
const tdvw = new AElf(
  new AElf.providers.HttpProvider("https://tdvw-test-node.aelf.io")
);

const wallet = AElf.wallet.createNewWallet();

async function getTokenAmount(address: string, aelf: any) {
  const tokenContractName = "AElf.ContractNames.Token";
  let tokenContractAddress;
  // get chain status
  const chainStatus = await aelf.chain.getChainStatus();
  // get genesis contract address
  const GenesisContractAddress = chainStatus.GenesisContractAddress;
  // get genesis contract instance
  const zeroContract = await aelf.chain.contractAt(
    GenesisContractAddress,
    wallet
  );
  // Get contract address by the read only method `GetContractAddressByName` of genesis contract
  tokenContractAddress = await zeroContract.GetContractAddressByName.call(
    AElf.utils.sha256(tokenContractName)
  );

  const tokenContract = await aelf.chain.contractAt(
    tokenContractAddress,
    wallet
  );

  const result = await tokenContract.GetBalance.call({
    symbol: "ELF",
    owner: address,
  });
  console.log(result);

  return result;
}

const address = process.env.ADDRESS;

if (!address) throw new Error("missing ADDRESS env var");

const aelfAmount = await getTokenAmount(address, aelf);
const tdvwAmount = await getTokenAmount(address, tdvw);

function convertELF(balance: string) {
  const elf = new BigNumber(balance).dividedBy(10 ** 8).toString();

  return `${elf} ELF`;
}

const webhook_url = process.env.LARK_WEBHOOK;

if (!webhook_url) throw new Error("missing LARK_WEBHOOK env var");

await fetch(webhook_url, {
  method: "POST",
  body: JSON.stringify({
    msg_type: "post",
    content: {
      post: {
        en_us: {
          title: "Faucet Token amount",
          content: [
            [
              {
                tag: "text",
                text: `AELF: ${convertELF(aelfAmount.balance)}`,
              },
              {
                tag: "a",
                text: "Explorer AELF ",
                href: `https://explorer-test.aelf.io/address/${address}`,
              },
              {
                tag: "a",
                text: "Explorer tDVW ",
                href: `https://explorer-test-side02.aelf.io/address/${address}`,
              },
              {
                tag: "text",
                text: `tDVW: ${convertELF(tdvwAmount.balance)}`,
              },
              {
                tag: "at",
                user_id: "all",
              },
            ],
          ],
        },
      },
    },
  }),
});