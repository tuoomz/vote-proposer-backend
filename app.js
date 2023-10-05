const express = require('express');
const jwt = require('jsonwebtoken');
const ethers = require('ethers');
const proposalVoterABI = require('./abi/ProposalVoterABI.json')

const app = express();
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const proposalVoterContract = new ethers.Contract(contractAddress, proposalVoterABI.abi, provider);

const JWT_SECRET = process.env.JWT_SECRET;

app.use((req, res, next) => {
    if (req.path === '/login') return next();

    const token = req.header('Authorization');
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).send('Invalid token');
    }
});

// Dummy login endpoint to get a token, you wou;d verify a username and password here in a production app
app.post('/login', (req, res) => {
    const token = jwt.sign({ someData: 'whatever' }, JWT_SECRET);
    res.json({ token });
});

// Fetch proposals
app.get('/proposals', async (req, res) => {
    const proposals = await proposalVoterContract.readProposals();
    const mappedProposals = proposals.map(item => ({
        title: item.title,
        description: item.description,
        yes: item.yesVotes.toString(),
        no: item.noVotes.toString()
    }));

    res.json(mappedProposals);
});

// Submit signed transaction for voting
app.post('/vote', async (req, res) => {
    try {
        const { rawTransaction } = req.body; // User sends rawTransaction as part of the request body
        const txReceipt = await web3.eth.sendSignedTransaction(rawTransaction);
        res.json({ message: 'Vote transaction sent', txReceipt });
    } catch (error) {
        console.error('Error sending vote transaction', error);
        res.status(400).json({ message: 'Error sending vote transaction' });
    }
});

// Submit signed transaction for creating a proposal
app.post('/submit-proposal', async (req, res) => {
    try {
        const { rawTransaction } = req.body; // User sends rawTransaction as part of the request body
        const txReceipt = await web3.eth.sendSignedTransaction(rawTransaction);
        res.json({ message: 'Proposal submission transaction sent', txReceipt });
    } catch (error) {
        console.error('Error sending proposal transaction', error);
        res.status(400).json({ message: 'Error sending proposal transaction' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});