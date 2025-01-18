<center><h1>Tree-conomy</h1></center>

## Abstract

This whitepaper introduces "Tree-conomy," an innovative blockchain-based system designed to revolutionize the logistics and tracking of forest restoration projects. By integrating physical tree lifecycle stages—from seed collection to mature tree planting—with blockchain technology, Tree-conomy offers transparency, security, and immutability in tracking each tree's journey. Utilizing Non-Fungible Tokens (NFTs) for each developmental stage (Seed, Sapling, Tree), this system ensures that every participant, from volunteers to funders, can validate and engage with the process. The protocol also features a vesting mechanism with "Tree-conomy" tokens that incentivize long-term project commitment and success. By bridging the gap between physical assets and digital records, Tree-conomy not only enhances the measurability and verifiability required for carbon markets but also fosters greater community involvement and accountability in environmental restoration efforts.

## Introduction 

In today’s increasingly digital world, the integration of physical assets with blockchain technology offers transformative opportunities across industries. Tracking the journey of physical items as they progress through various stages of production, or in our case, from volunteer-collected seed to a fully grown tree at a restoration site, has traditionally been cumbersome, opaque, and inefficient. Current systems often lack the transparency and security needed for stakeholders to trace the origin and history of materials or products. This is especially true in environmental initiatives, where tracking tools are prone to errors in both reporting and validation—issues that undermine the credibility and quality of activities like forest restoration initiatives and project emissions tracking systems. The lack of adequate and functional tracking systems hinders funders and volunteers from accurately assessing the impact of their activities, limiting both the study efficacy of differing approaches to restoration, and the ability of organizations to conduct community engagement by attributing ownership of effort and outcome to individuals and organizations. 
 
In natural restoration projects, there is a pressing need to track critical data points, such as whether forests are being planted with regionally appropriate trees that reflect the desired native biodiversity and species mix, including the age and spatial composition of such plantings. Likewise, on the planning side of such projects there is a need to understand the current and future capacity of volunteers, nurseries, and farms to deliver the right species of tree. There are many important data points that are critical to store in immutable blockchain form to enable the trustworthy measurement, verification, and additionality of projects looking to participate in carbon market programs, including the location and number of plantings being supplied by differing seed stocks, and, importantly, whether the planted trees continue to grow. Additionally, having data that covers the logistics involved in the production of new forests and attribution to it all of its sources – volunteers, tree nurseries, landholders, and funders along the way will enable a much better understanding of forest-restoration logistics, enhancing value for those looking to improve or accelerate reforestation efforts. Deeper understanding how much carbon these trees store and the other benefits they provide—such as food, economic value, and biodiversity—is vital for both people and the environment, but can’t occur without the forest restoration logistical solution we are proposing in this whitepaper. 
 
Not all trees grow to maturity, and not all tree-planting campaigns succeed. Tracking tree seed collection, planting, and growth over time can help governments, companies, and NGOs assess progress on public pledges, replicate successful projects by providing methods for collecting and replacing missing data, provide empirical evidence for program metrics, allow evidenced based assessments of effectiveness, provide guideposts for effective program implementation and best practices, allow volunteers to track their impacts, and inspire funders to continue supporting initiatives where past progress is clearly documented.
 
Our project harnesses blockchain technology to create an innovative system where physical items, like seeds collected by professionals or volunteers, are registered at the start of their lifecycle and meticulously tracked as they progress from seed to tree. At each stage of this journey, Non-Fungible Tokens (NFTs) are minted to represent the item's status, generating a transparent and immutable record enriched with metadata that answers critical questions. This system not only enhances transparency in the forest-restoration-logistics supply chain but also incentivizes participants by rewarding stakeholders at key milestones, making the process more engaging and rewarding for all involved.
 
By embedding visibility and verification into the process—from seed to tree—we empower volunteers, community members, and stakeholders to actively participate in the creation and monitoring, and analysis of these restoration projects. Using blockchain’s decentralized ledger, every step in the item’s lifecycle is securely recorded, verifiable, and tamper-proof. Our solution provides the trust and accountability needed to drive meaningful change in both supply chains and environmental restoration efforts, while creating new opportunities for value generation through NFTs and milestone-based recognition.


## Problem Statement

Forest-restoration-logistics are inefficient or do not exist at all, do not scale well, making the resulting restoration projects lack the required investment-grade measurability, immutability, and verifiability required for carbon markets. 
    • No carbon marketplace lets participants place a single planted tree in service, creating a gap in incentives for tree plantings by individuals. 
    • Nurseries and other tree growers don’t have an easy way of identifying what is being planted in projects and what is being collected in order to create a better just-in-time-tree-production process. 
    • Funders and environmental scientists do not have quality data and it’s hard to track seed collection sites/locations/stocks and give credit to volunteers, or discover valuable insights to expand production.
    • It’s hard to know which seeds end up becoming saplings and where they are being stored, limiting efforts to ensure appropriate species composition and diversity for project sites.
    • It’s hard for project funders and owners to verify that plantings have regionally appropriate tree species in the correct composition for the local ecosystem, potentially limiting the ecosystem benefits from forest restoration logistics. 
    • Funders do not have a complete record of the different types of trees are planted over time and their specific locations. 
    • Measurement and verification by all interested stakeholders is hampered by limited ability to verify if a tree is still there later, making assessment of, and rewards for environmental benefits due to planting difficult. 
    • People are not recognized for their volunteer activity, funders don’t have long-term tracking of outcomes, and nurseries can’t incentivize high-quality seed collection to help identify which stock is needed before projects start. 
    • Some individual projects do track tree growth, but each project follows its own method, and the type and quality of data vary greatly. Much of this data is not independently verified and only spans the first few years of the project (before the trees fully mature). This project would enable high quality, tree specific, tracking. 

## Solution and Vision: Tree-conomy and Tree Token System 
The Tree-conomy and Tree Token system we are proposing will be specifically configured and designed to enable forest-supply chain logistics, improving the current states of participation, measurement, and verification for forest restoration projects. 

The Tree Token system will enable functional logistics to bridge the physical to digital gap.

## Functionality of Protocol
There are many steps a user can take to interact with our protocol.  Below are detailed description of these steps.

##### Step 1. Minting of Seed NFT and Locking Tree Tokens in Vesting Contract

![image showing diagram](/offchain/public/readme/step1.jpg)

The user (for the rest of the description we will call the user Bob) has collected a seed of a type of species of tree with the collection location.  Bob will use the app to start a transaction where he provides proof of the seed which an AI bot will verify and partially sign.  Bob will also sign the transaction and will mint Bob a Seed NFT which will contain metadata of the location, datetime, tree number, and species of tree.  This transaction mint Tree Tokens equivalent to the emissions reduced over the life of the tree which will be reserved release for when criteria are met, such as the tree having been verifiably planted for one year, at which point the equivalent Tree Tokens will be released from the contract. In our base case, and for the example here, we are using a generic amount of 10000 tokens and lock them in a vesting contract.


##### Step 2.  Generate a Sapling NFT and burn the Seed NFT with proof of sapling

![image showing diagram](/offchain/public/readme/step2.jpg)

In step two we are following the seed through it’s lifecycle by tracking that the tree has gone from seed to planted tree. This is an important step because seeds are often collected in different areas and planted in different times from where the sapling is eventually planted.  When the seed has produced a sapling Bob can create another transaction.  He can submit boolean proof that he has a sapling that is verified by an AI bot and also that he has a Seed NFT.  This will allow Bob to mint a Sapling NFT with the same metadata as the Seed NFT.  This transaction will also burn his Seed NFT.

##### Step 3. Generate a Tree NFT and burn the Sapling NFT with proof of tree project 

![image showing diagram](/offchain/public/readme/step3.jpg)

After the sapling has been in place for a year we can log the tree as a part of a project. The tree can now produce emissions rewards under the smart contract created via the Tree NFT which can be traded.  When the sapling has produced a tree that can be a part of a project Bob can create another transaction. He can submit boolean proof that he has a tree that is in its final location and has been growing for at least a year, which is then verified by an AI bot and also that he has a Sapling NFT. This will allow Bob to mint a Tree NFT with the same metadata as the Sapling NFT.  This transaction will also burn his Sapling NFT.

##### Step 4. Unlock Rewards from Vesting Contract 

![image showing diagram](/offchain/public/readme/step4.jpg)

Once Bob has the Tree NFT as described under step 3 he is allowed to start unlocking his rewards.  For each year after that the tree is demonstrated to be in place, as verified by the AI, the Tree NFT will release through the original smart contract a set amount of tree token rewards equivalent to the emissions absorbed by that species of tree during the prior year.  For our example case, he is allowed to unlock 1000 tree tokens a year until the tokens are exhausted (10 years).  He can unlock once a year or wait until the end of the 10-year period and unlock them all at once.  The only requirement is the Tree NFT.

Note: The NFT is not associated with an address so users are free to exchange, sell, buy, or trade the tokens as them deem necessary.  All that matters is when claiming tokens the user is in in the possession of the Tree NFT they are wishing to claim tokens for. 