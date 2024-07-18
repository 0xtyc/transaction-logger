import { expect } from "chai";
import { ethers, ignition } from "hardhat";
import TransactionLoggerModule from "../ignition/modules/TransactionLogger";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ERC20 } from "../typechain-types";

describe("TransactionLogger", function () {
  let txLogger: Contract;
  let tokenContract: ERC20;
  let signers: HardhatEthersSigner[];
  let receiver: string;
  let receiver1: string;

  beforeEach(async function () {
    const TokenContract = await ethers.getContractFactory("ThankYouCoin");
    tokenContract = await TokenContract.deploy(100);

    const tokenAddress = await tokenContract.getAddress();
    const deployment = await ignition.deploy(TransactionLoggerModule, {
      parameters: {
        TransactionLoggerModule: {
          erc20Address: tokenAddress,
          minAmount: "10",
        },
      },
    });
    txLogger = deployment.txLogger;

    // Get the list of local testing accounts and use them as receivers
    signers = await ethers.getSigners();
    receiver = signers[1].address;
    receiver1 = signers[2].address;
  });

  describe("sendFunds", function () {
    it("Should revert if send less than mininum amount of token", async function () {
      const amountToSend = 5;
      await expect(txLogger.sendFunds(receiver, amountToSend)).to.be.revertedWithCustomError(
        txLogger,
        "TransactionLogger__MininumTransferAmountNotMet",
      );
    });

    it("Should revert if the sender has not approved the contract to spend the token", async function () {
      const amountToSend = 20;
      await expect(txLogger.sendFunds(receiver, amountToSend)).to.be.revertedWithCustomError(
        txLogger,
        "TransactionLogger__InsufficientAllowance",
      );
    });

    it("Should send token to the receiver", async function () {
      const receiverBalanceBefore = await tokenContract.balanceOf(receiver);
      await tokenContract.approve(txLogger.getAddress(), 20);

      await txLogger.sendFunds(receiver, 20);
      const receiverBalanceAfter = await tokenContract.balanceOf(receiver);
      // Check the receiver balance increased by the amount sent and the contract balance is 0
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + BigInt(20));
    });
  });

  describe("sendMultipleFunds", function () {
    it("Should revert if send less than mininum eth", async function () {
      const amountsToSend = [3, 9];

      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], amountsToSend),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MininumTransferAmountNotMet");
    });

    it("Should revert when number of receivers is larger than number of amount", async function () {
      await expect(
        txLogger.sendMultiFunds([receiver, receiver1], [10]),
      ).to.be.revertedWithCustomError(txLogger, "TransactionLogger__MismatchedReceiversAndAmounts");
    });

    it("Should revert when number of receivers is fewer than number of amount", async function () {
      await expect(txLogger.sendMultiFunds([receiver], [20, 30])).to.be.revertedWithCustomError(
        txLogger,
        "TransactionLogger__MismatchedReceiversAndAmounts",
      );
    });

    it("Should send funds to all receivers", async function () {
      const amountsToSend = [20, 20];
      const receiverBalanceBefore = await tokenContract.balanceOf(receiver);
      const receiver1BalanceBefore = await tokenContract.balanceOf(receiver1);
      await tokenContract.approve(txLogger.getAddress(), 40);
      await txLogger.sendMultiFunds([receiver, receiver1], amountsToSend);

      const receiverBalanceAfter = await tokenContract.balanceOf(receiver);
      const receiver1BalanceAfter = await tokenContract.balanceOf(receiver1);
      // Check the receiver balance increased by the amount sent and the contract balance is 0
      expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + BigInt(amountsToSend[0]));
      expect(receiver1BalanceAfter).to.equal(receiver1BalanceBefore + BigInt(amountsToSend[1]));
    });
  });

  describe("Events", function () {
    it("Should emit an event on sendFunds success", async function () {
      const amountToSend = 10;
      await tokenContract.approve(txLogger.getAddress(), amountToSend);
      const tx = await txLogger.sendFunds(receiver, amountToSend);
      const receipt = await tx.wait();

      // Get the block and its timestamp
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp;

      await expect(tx)
        .to.emit(txLogger, "TransactionSent")
        .withArgs(signers[0], receiver, amountToSend, timestamp);
    });

    it("Should emit multiple event on sendMultiFunds success", async function () {
      const amountsToSend = [20, 20];
      await tokenContract.approve(txLogger.getAddress(), 40);

      // Send funds and get the transaction receipt
      const tx = await txLogger.sendMultiFunds([receiver, receiver1], amountsToSend);
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
