import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, ignition } from "hardhat";
import ThankYouCoinModule from "../ignition/modules/ThankYouCoin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ThankYouCoin", function () {
  let thankYouCoin: Contract;
  let signers: HardhatEthersSigner[];
  let owner: string;
  let addr1: string;
  let addr2: string;

  beforeEach(async function () {
    const deployment = await ignition.deploy(ThankYouCoinModule);
    thankYouCoin = deployment.thankYouCoin;

    signers = await ethers.getSigners();
    owner = signers[0].address;
  });

  describe("Deployment", function () {
    it("Has a name", async function () {
      expect(await thankYouCoin.name()).to.equal("ThankYouCoin");
    });

    it("Has a symbol", async function () {
      expect(await thankYouCoin.symbol()).to.equal("TYC");
    });

    it("Assigns the initial total supply to the owner", async function () {
      const ownerBalance = await thankYouCoin.balanceOf(owner);
      expect(ownerBalance).to.equal(1024 * 10 ** 6);
    });
  });

  describe("mint", function () {
    it("Should mint tokens", async function () {
      const amount = 100;
      await thankYouCoin.mint(owner, amount);
      const ownerBalance = await thankYouCoin.balanceOf(owner);
      expect(ownerBalance).to.equal(1024 * 10 ** 6 + amount);
    });

    it("Should revert if not called by the owner", async function () {
      const amount = 100;
      await expect(
        (thankYouCoin.connect(signers[1]) as Contract).mint(owner, amount)
      ).to.be.revertedWith("Only owner can mint");
    });
  });

  describe("Decimals", function () {
    it("Has 6 decimals", async function () {
      expect(await thankYouCoin.decimals()).to.equal(6);
    });
  });
});
