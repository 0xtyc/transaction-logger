import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TransactionLoggerModule = buildModule("TransactionLoggerModule", (m) => {
  const txLogger = m.contract("TransactionLogger", [
    m.getParameter("erc20Address"),
    m.getParameter("minAmount"),
  ]);

  return { txLogger };
});

export default TransactionLoggerModule;
