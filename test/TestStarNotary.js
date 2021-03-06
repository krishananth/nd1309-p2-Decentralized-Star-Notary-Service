require("@babel/polyfill");

const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let starId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', starId, {from: accounts[1]})
    assert.equal(await instance.tokenIdToStarInfo.call(starId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});
    let balanceOfSellerBeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfSellerAfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfSellerBeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfSellerAfterTransaction);
    assert.equal(value1, value2);
});


it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});


it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.approve(user2, starId, {from: user1});
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});


// Implement Task 2 Add supporting unit tests
it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    let starId = 7;
    let starName = 'Sirius - the brightest star!';
    let user1 = accounts[1];
    let instance = await StarNotary.deployed();
    await instance.createStar(starName, starId, {from: user1});

    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let star7Name = await instance.tokenIdToStarInfo.call(starId);
    assert.equal(starName, star7Name);

    let starSymbol = await instance.symbol();
    assert.equal(starSymbol, 'uSTAR', 'Star Symbol matches!!');

});
 
it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let star1Id = 8;
    let star1Name = 'Sirius-8';

    let star2Id = 9;
    let star2Name = 'Sirius-9'

    let user1 = accounts[1];
    let user2 = accounts[2];

    let instance = await StarNotary.deployed();
    await instance.createStar(star1Name, star1Id, {from: user1});
    await instance.createStar(star2Name, star2Id, {from: user2});

    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.approve(user2, star1Id, {from: user1});
    await instance.approve(user1, star2Id, {from: user2});
    await instance.exchangeStars(star1Id, star2Id, {from: user1});
    
    // 3. Verify that the owners changed
    let star1Owner = await instance.ownerOf(star1Id);
    let star2Owner = await instance.ownerOf(star2Id);
    assert.equal(star1Owner, user2, 'Star1 Owner is User2 now!!');
    assert.equal(star2Owner, user1, 'Star2 Owner is User1 now!!');
});


it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let starId = 10;
    let starName = 'Sirius-10';

    let user1 = accounts[1];
    let user2 = accounts[2];

    let instance = await StarNotary.deployed();
    await instance.createStar(starName, starId, {from: user1});

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.approve(user2, starId, {from: user1});
    await instance.transferStar(user2, starId, {from: user1});

    // 3. Verify the star owner changed.
    let newOwner = await instance.ownerOf(starId);
    assert.equal(newOwner, user2, 'Star Owner changed from User1 to newOwner');
});


it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    let starId = 11;
    let starName = 'Sirius-11';

    let user1 = accounts[1];

    let instance = await StarNotary.deployed();
    await instance.createStar(starName, starId, {from: user1});    
    
    // 2. Call your method lookUptokenIdToStarInfo
    let starInstanceName = await instance.lookUptokenIdToStarInfo(starId);

    // 3. Verify if you Star name is the same
    assert.equal(starInstanceName, starName, 'Star name Sirius-11 matches!!');
});