import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import TransactionLoggerModule from "../ignition/modules/TransactionLogger";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TransactionLogger", function () {
  let txLogger: Contract;
  let signers: HardhatEthersSigner[];
  let receiver: string;
  let receiver1: string;

  beforeEach(async function () {
    const deployment = await ignition.deploy(TransactionLoggerModule);
    txLogger = deployment.txLogger;

    // Get the list of local testing accounts and use them as receivers
    signers = await ethers.getSigners();
    receiver = signers[1].address;
    receiver1 = signers[2].address;
  });

  describe("sendFunds", function () {
    it("Should revert if send less than mininum eth", async function () {
      const amountToSend = ethers.parseEther("0.0001");
      await expect(
        txLogger.sendFunds(receiver, { value: amountToSend }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MininumTransferAmountNotMet");
    });

    it("Should revert when _call fails", async function () {
      const amountToSend = ethers.parseEther("1");

      // Deploy the RevertingContract
      const RevertingContract = await ethers.getContractFactory("RevertingContract");
      const revertingContract = await RevertingContract.deploy();

      // Expect the transaction to be reverted
      await expect(
        txLogger.sendFunds(revertingContract.getAddress(), { value: amountToSend }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__TransactionFailed");
      // contract balance should be 0
      const contractBalance = await ethers.provider.getBalance(txLogger.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it("Should send funds to the receiver", async function () {
      const amountToSend = ethers.parseEther("1");

      const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
      await txLogger.sendFunds(receiver, { value: amountToSend });
      const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
      const contractBalance = await ethers.provider.getBalance(txLogger.getAddress());
      // Check the receiver balance increased by the amount sent and the contract balance is 0
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + amountToSend);
      expect(contractBalance).to.equal(0);
    });
  });

  describe("sendMultipleFunds", function () {
    it("Should revert if send less than mininum eth", async function () {
      const amountsToSend = [ethers.parseEther("0.0001"), ethers.parseEther("0.5")];
      const totalAmount = ethers.parseEther("0.5001");

      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, { value: totalAmount }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MininumTransferAmountNotMet");
    });

    it("Should revert when number of receivers is larger than number of amount", async function () {
      const amountsToSend = [ethers.parseEther("0.1")];
      const totalAmount = ethers.parseEther("0.1");
      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, { value: totalAmount }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MismatchedReceiversAndAmounts");
    });

    it("Should revert when number of receivers is fewer than number of amount", async function () {
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.1")];
      const totalAmount = ethers.parseEther("0.2");
      await expect(
        txLogger.sendMultiFunds([receiver], amountsToSend, { value: totalAmount }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MismatchedReceiversAndAmounts");
    });

    it("Should revert when sum of amounts is less than sent amount", async function () {
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.3")];

      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, {
          value: ethers.parseEther("0.3"),
        }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__InsufficientOrExcessFunds");
    });

    it("Should revert when sum of amounts is more than sent amount", async function () {
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.3")];

      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, {
          value: ethers.parseEther("0.5"),
        }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__InsufficientOrExcessFunds");
    });

    it("Should revert all transactions when one of the transaction fails", async function () {
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.5")];
      const totalAmount = ethers.parseEther("0.6");
      const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
      const receiver1BalanceBefore = await ethers.provider.getBalance(receiver1);

      // Deploy the RevertingContract
      const RevertingContract = await ethers.getContractFactory("RevertingContract");
      const revertingContract = await RevertingContract.deploy();

      // Expect the transaction to be reverted
      await expect(
        txLogger.sendMultiFunds([receiver, revertingContract.getAddress()], amountsToSend, { value: totalAmount }),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__TransactionFailed");
      
      const contractBalance = await ethers.provider.getBalance(txLogger.getAddress());
      const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
      // the receiver balance should be the same as before and the contract balance should be 0
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore);
      expect(contractBalance).to.equal(0);
    });

    it("Should send funds to all receivers", async function () {
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.5")];
      const totalAmount = ethers.parseEther("0.6");
      const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
      const receiver1BalanceBefore = await ethers.provider.getBalance(receiver1);

      await txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, { value: totalAmount });

      const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
      const receiver1BalanceAfter = await ethers.provider.getBalance(receiver1);
      const contractBalance = await ethers.provider.getBalance(txLogger.getAddress());
      // Check the receiver balance increased by the amount sent and the contract balance is 0
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + amountsToSend[0]);
      expect(receiver1BalanceAfter).to.equal(receiver1BalanceBefore + amountsToSend[1]);
      expect(contractBalance).to.equal(0);
    });
  });

  describe("Events", function () {
    it("Should emit an event on sendFunds success", async function () {
      const { txLogger } = await ignition.deploy(TransactionLoggerModule);
      const amountToSend = ethers.parseEther("1");

      const tx = await txLogger.sendFunds(receiver, { value: amountToSend });
      const receipt = await tx.wait();

      // Get the block and its timestamp
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp;

      await expect(tx)
        .to.emit(txLogger, "TransactionSent")
        .withArgs(signers[0], receiver, amountToSend, timestamp);
    });

    it("Should emit multiple event on sendMultiFunds success", async function () {
      const { txLogger } = await ignition.deploy(TransactionLoggerModule);
      const amountsToSend = [ethers.parseEther("0.1"), ethers.parseEther("0.5")];
      const totalAmount = ethers.parseEther("0.6");

      // Send funds and get the transaction receipt
      const tx = await txLogger.sendMultiFunds([receiver, receiver1], amountsToSend, {
        value: totalAmount,
      });
      const receipt = await tx.wait();

      // Get the block and its timestamp
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp;

      await expect(tx)
        .to.emit(txLogger, "TransactionSent")
        .withArgs(signers[0], receiver, amountsToSend[0], timestamp);

      await expect(tx)
        .to.emit(txLogger, "TransactionSent")
        .withArgs(signers[0], receiver1, amountsToSend[1], timestamp);
    });
  });
});
