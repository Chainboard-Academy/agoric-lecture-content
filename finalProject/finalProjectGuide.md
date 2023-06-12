# Agoric Bootcamp: Final Project Guide

## Description

The Final project will be divided into 4 stages:
- project draft
- project plan
- project development
- final presentation

For each stage you will deliver your results, which will be reviewed by the mentors who will provide constructive feedback and assure that you fulfill all the necessary requirements to start the next stage.
For this reason, we ask you to not extend the defined deadlines to assure that you have the required time to complete all stages.

## Team Structure

The Final Project can be performed in teams or individually. Students can choose to pair up with another student to work on the final project or can work individually.

For teams:
- Each team will consist of two students and no more, this means you either pair up with another student or you work individually;
- Both **must-have** and **nice-to-have** sections in the Technical Prerequisites are mandatory for teams.

For individuals:
- Individual students will get extra technical support from mentors;
- Only the **must-have** section in the Technical Prerequisites is mandatory for individuals.

## Technical Prerequisites

### Must-Have

- The code must never violate the offer safety;
- Students must avoid using unnecessary awaits in their code;
- Sending offers from one smart contract to another must be done using offerTo, if needed;
- Each Dapp must have a UI where:
    - Dapp connects to the correct ag-solo;
    - Dapp can send offers to ag-solo;
    - Dapp listens for state changes coming from the blockchain;
    - No extensive UI design is necessary, one page where every behavior above is showcased using simple HTML components is accepted;
- On-chain code should be deployed to a local blockchain(see lecture seven);
- The demo scenario must demonstrate an interaction between multiple ag-solos;
- Extensive use of deploy scripts are welcomed.

### Nice-to-have (mandatory for teams)

- Improve UI design:
    - Have colorful, easy to use multiple UI components;
    - Show as much data as possible from UI in accordance with your scenario/project;
- Include interaction with an inter-protocol component like:
    - AMM;
    - PSM;
    - VaultFactory;
- Include a dependency to your business logic where some action is taken in response to a price change in an asset pair. Your code must listen and trigger, when the condition is met, by using a PriceAuthority (see lecture eight).

## Project Stages

### Project draft

This stage duration will be 1 week, from lecture 8 to 9.
At the end, you should deliver a document answering the following questions:
- Team members;
- Project context (what problem are you trying to solve);
- Solution proposal (what approach are you taking to solve the problem);
- State of the Art (Is there any applications with similar logic/implementation that you are using as inspiration);
- Agoric components that you intend to use.


### Project plan

This stage duration will be 1 week, from lecture 9 to 10.
At the end, you should deliver a document answering the following questions:
- Application features;
- Application modules (class diagram);
- Happy path to use the application (sequence diagram);
- Front end mockups.

### Project development

This stage duration will be 2 weeks, from lecture 10 to project presentation.
At the end, you should deliver GitHub repository with the following components:
- Code (according to Technical Prerequisites);
- Unit tests;
- Deploy scripts;
- Documentation (README file).

### Final Presentation
This stage duration will be 1 day, on 30/06/23. 
At the end, you should deliver a PowerPoint presentation, of maximum 20 minutes, that includes the following:
- Team composition;
- Project context;
- Project solution;
- Agoric components used;
- Live or recorded Demo;
- Major challenges faced;
