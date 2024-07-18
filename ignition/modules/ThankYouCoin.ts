import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ThankYouCoinModule = buildModule("ThankYouCoinModule", (m) => {
  const thankYouCoin = m.contract("ThankYouCoin", [1024]);

  return { thankYouCoin };
});

export default ThankYouCoinModule;

