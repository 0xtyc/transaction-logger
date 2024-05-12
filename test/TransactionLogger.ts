import { expect } from "chai"
import { ethers, ignition } from "hardhat"
import TransactionLoggerModule from "../ignition/modules/TransactionLogger"

describe("TransactionLogger", function () {
  describe("sendFunds", function () {
    describe("sendFunds", function () {
      it("Should revert if send 0 eth", async function () {
        const { txLogger } = await ignition.deploy(TransactionLoggerModule)
        const amountToSend = ethers.parseEther("0")
        // Get the list of local testing accounts
        const signers = await ethers.getSigners()

        // Use the second account as the receiver
        const receiver = signers[1].address
        await expect(
          txLogger.sendFunds(receiver, { value: amountToSend }),
        ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__InsufficientFunds")
      })

      it("Should revert when _call fails", async function () {
        const { txLogger } = await ignition.deploy(TransactionLoggerModule)
        const amountToSend = ethers.parseEther("1")

        // Deploy the RevertingContract
        const RevertingContract = await ethers.getContractFactory("RevertingContract")
        const revertingContract = await RevertingContract.deploy()

        // Expect the transaction to be reverted
        await expect(
          txLogger.sendFunds(revertingContract.getAddress(), { value: amountToSend }),
        ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__sendFundsFailed")
        // contract balance should be 0
        const contractBalance = await ethers.provider.getBalance(txLogger.getAddress())
        expect(contractBalance).to.equal(0)
      })

      it("Should send funds to the receiver", async function () {
        const { txLogger } = await ignition.deploy(TransactionLoggerModule)
        const amountToSend = ethers.parseEther("1")

        const signers = await ethers.getSigners()

        // Use the second account as the receiver
        const receiver = signers[1].address
        const receiverBalanceBefore = await ethers.provider.getBalance(receiver)
        await txLogger.sendFunds(receiver, { value: amountToSend })
        const receiverBalanceAfter = await ethers.provider.getBalance(receiver)
        const contractBalance = await ethers.provider.getBalance(txLogger.getAddress())
        // Check the receiver balance increased by the amount sent and the contract balance is 0
        expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + amountToSend)
        expect(contractBalance).to.equal(0)
      })
    })

    describe("Events", function () {
      it("Should emit an event on sendFunds success", async function () {
        const { txLogger } = await ignition.deploy(TransactionLoggerModule)
        const amountToSend = ethers.parseEther("1")

        const signers = await ethers.getSigners()

        // Use the second account as the receiver
        const receiver = signers[1].address

        // Send funds and get the transaction receipt
        const tx = await txLogger.sendFunds(receiver, { value: amountToSend })
        const receipt = await tx.wait()

        // Get the block and its timestamp
        const block = await ethers.provider.getBlock(receipt.blockNumber)
        const timestamp = block?.timestamp

        await expect(tx)
          .to.emit(txLogger, "TransactionSent")
          .withArgs(signers[0], receiver, amountToSend, timestamp)
      })
    })
  })
})
