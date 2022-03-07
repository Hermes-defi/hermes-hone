# hONE: A staking vault contract for Harmony

```
WΞNDΞL (bitdeep) from Hermes Defi team
hermesdefi@gmail.com
hermesdefi.io
```

# Abstract

We propose a defi primitive building block for ONE staking system where users can use the staking reward share of Harmony ONE to get more yield on Hermes ecosyste, or any other defi service that offers incentive for hONE holders.

We propose a ONE staking system via contract that allows users to use any wallet that operates  via RPC system (like metamask, wallet connect etc) to: stake, unstake and withdraw assets from ONE staking system.

We propose an implementation where users can stake funds on a shared vault system that pays proportional reward to users. This system will allow implementation of an auto-compound system for all users that stake ONE on this implementation.

Our implementation do the auto-compound of reward automatically and provide a way to  implement a second layer of reward on top of Harmony Reward to incentive users to use  our implementation instead of native Staking system.

# 1. Introduction

The current ONE staking system is possible via a specific wallet, where users access a dashboard  and choose from a list of delegators from a true free market service system. Users tend to choose the most advantageous fee to maximize profit.

In 02-11-2022 the Harmony team activated a hardfork where it became possible to do staking operations via assembly op-codes, allowing the creation of smart contracts that can stake/unstake on ONE network via any rpc wallet, like Metamask, for example.

With this in mind, the DevOps Hermes Team that operates the Hermes RPC public service and the Hermes Validator asked if it was possible to do our own staking implementation, immediately Marketing team asked if it was possible to add a second layer of reward on top One network reward.

Then we started our research and came to the conclusion after reading Harmony Core Dev team code that it was possible to do our own implementation with adding auto-compound to Harmony reward and adding a second layer of reward system on top of Harmony reward.

During our research we noted that the best system to use was a mix of xSUSH and Beefy vaults model, this because of:
We needed to maximize user profits via auto-compound.
We needed to maximize user delegation funds on Hermes systems in relation to other node operators.
We needed a system where we can pay user reward according to user share in the system.
This share system should generate a token where it can then be then used to reward user on others' reward system on Hermes ecosystem.

After analyzing various systems, we came to the conclusion that the best model is a combination of the sSUSHI model where users get paid according to their share in the system and the beefy vault auto compound model. This allowed us to design a system where user deposit an asset, receive a receipt and ERC20 token to use on other reward system.

# 2. Deposit, Unstake and Withdraw

The Harmony Network do its security via staking system delegators, one characteristic of the system is that when you stake ONE to the network, you need to wait 127 hours or few epochs to get your ONE back when you do the unstake process.

The process is automatic, ie, after you unstake, you wait 127 hours and then your ONE will appear in your wallet.

During our research we noted that it complicates things, because when users stake, who is effectively staking to the network is our contract, so when funds are released, in fact it gets released to our contract, not to the user wallet. For this reason, we had to design a credit system where users request an unstake of funds, wait 127 hours and then, after funds get released to the contract, the user can withdraw funds + rewards.

So, our implementation works like this:

1. User deposit to our contract.
2. Contract deposit funds to Harmony network.
3. Contract mint hONE token to user.
4. In the future, users decide to get funds back.
5. User request funds via Unstake
6. the hONE token gets burned.
7. User principal balance plus user reward get stored in the waiting queue.
8. Users wait 127 hours.
9. Users can now withdraw all funds (principal + rewards).

# 3. Hermes Staked ONE (hONE)

The hONE represents the user share in the entire system, user receives this token as proportion of his ONE staked in the contract.

The formula to compute hONE on deposit is:

```user hONE shares = (user deposit * hONE total supply) / ONE contrat balance```

hONE is just a simple ERC20 token controlled minted/burned by the vault contract, ie, the team has no control over minting of hONE tokens.

hONE token allows the Hermes Team to add other layers of reward combination and incentivization in the Hermes systems, like allowing depositing hONE token into farming systems or pairing hONE with ONE in the Hermes Swap.

Attention: user must preserve it's hONE token, because the only way to get back his ONE from staking system is burning hONE balance.

# 4. A second layer of reward

As hONE is a ERC20 compatible token, it allows Hermes Team to do additional incentive combinations on top of ONE reward system.

Some incentives systems that can be implemented is:

1. allow users to deposit hONE into MasterChef contract and receive Hermes reward.
2. allow users to deposit hONE into a SingleStake contract where users can receive partner tokens or ONE from Harmony Team.
3. allow user to deposit hONE into any partner contract to lock and receive any other token outside Hermes ecosystem.

# 5. Incentive mechanisms

What is the incentive for any user to stake ONE with Hermes Defi instead of any other node operator?

First, Hermes has one of lowest fees in the ONE staking system, only 5%, second, user that stake with Hermes get the hONE share token that allow user to deposit same token on other Hermes incentives mechanism and get an additional layer of reward, effectively doubling or even more it's ONE reward.

One possible combination is:

1. Users deposit ONE to our staking vault.
2. User get hONE
3. Users deposit hONE to our farming contract.
4. Users get Hermes token.

This is one of simplest double reward system that users can get access to.

# 6. Claiming principal and reward

By Harmony network design, when you stake and unstake, you won't get your ONE immediately, it takes a few epochs to get your reward back.

Following Harmony network design, we stake all reward when a new user make a deposit. This way, it's not possible to get any reward isolated from principal funds.

So, how user get reward?

To get reward, user must withdraw the principal, on this moment, user get it's shares of rewards from the system.

# 7. Simplified Reward Payment

The simplified reward system was designed to allow user to auto compound it's rewards automatically for maximum possible return.

The reward collection and staking back is done when any user make a new deposit into the system, at this time any reward available in the contract address is collected and staked back.
This model is possible because each user has a share of all deposited assets, this permit the contract to work like a vault, optimizing it's assets to maximum performance.


# 8. Conclusion

We have developed a system for ONE staking without relying on any team trust or manual operation.

Our staking implementation contract has no privileged funds admin operations.

# References

[1] SushiSwap, "xSUSHI," https://etherscan.io/token/0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272

[2] Harmony Development, "Harmony Staking," https://github.com/MaxMustermann2/harmony-staking-precompiles


