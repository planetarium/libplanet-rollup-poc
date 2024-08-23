const socket = io('/rollup');

const getElementById = (id) => document.getElementById(id) || null;

const outputRootText = getElementById('ori-or');
const l2OutputIndexText = getElementById('ori-l2-oi');
const l2BlockNumberText = getElementById('ori-l2-bn');
const l1TimestampText = getElementById('ori-l1-ts');

socket.on("connect", () => {
    console.log(socket.connected); // true
});

socket.on("disconnect", () => {
    console.log(socket.connected); // false
});

socket.on('onOutputProposed', (data) => {
    outputRootText.value = data.outputRoot;
    l2OutputIndexText.value = data.l2OutputIndex;
    l2BlockNumberText.value = data.l2BlockNumber;
    l1TimestampText.value = data.l1Timestamp;
})