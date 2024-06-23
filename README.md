# Transaction Logger

This is a simple transaction logger application that logs transactions by interacting with this contract and emitting events. 

## Usage

The users can call `sendFunds` or `sendMultiFunds` to make transactions, and we can keek track of these transactions easily by the emitted events via Moralis api. 

## Deployment
```
hardhat ignition deploy ignition/modules/TransactionLogger.ts --network netowrkname --verify 
```