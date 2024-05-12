import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const TransactionLoggerModule = buildModule("TransactionLoggerModule", (m) => {
  const txLogger = m.contract("TransactionLogger")

  return { txLogger }
})

export default TransactionLoggerModule
