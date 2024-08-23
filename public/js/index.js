const getElementById = (id) => document.getElementById(id) || null;

// Initializing
const headerMenuDeposit = getElementById('hm-d');
const headerMenuWithdraw = getElementById('hm-w');
const headerMenuBatchSubmit = getElementById('hm-bs');
const headerMenus = [headerMenuDeposit, headerMenuWithdraw, headerMenuBatchSubmit];

const cardDeposit = getElementById('c-d');
const cardWithdraw = getElementById('c-w');
const cardBatchSubmit = getElementById('c-bs');
const cards = [cardDeposit, cardWithdraw, cardBatchSubmit];

headerMenuDeposit.addEventListener('click', () => {
    toggleMenu(0);
    toggleCard(0);
});
headerMenuWithdraw.addEventListener('click', () => {
    toggleMenu(1);
    toggleCard(1);
});
headerMenuBatchSubmit.addEventListener('click', () => {
    toggleMenu(2);
    toggleCard(2);
});

const toggleMenu = (index) => {
    headerMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleCard = (index) => {
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

const cwHeaderMenuWithdraw = getElementById('cw-hm-w');
const cwHeaderMenuProve = getElementById('cw-hm-p');
const cwHeaderMenuFinalize = getElementById('cw-hm-f');
const cwHeaderMenus = [cwHeaderMenuWithdraw, cwHeaderMenuProve, cwHeaderMenuFinalize];

const cwCardBodyWithdraw = getElementById('cw-cb-w');
const cwCardBodyProve = getElementById('cw-cb-p');
const cwCardBodyFinalize = getElementById('cw-cb-f');
const cwCardBodies = [cwCardBodyWithdraw, cwCardBodyProve, cwCardBodyFinalize];

cwHeaderMenuWithdraw.addEventListener('click', () => {
    toggleCwMenu(0);
    toggleCwCardBody(0);
});
cwHeaderMenuProve.addEventListener('click', () => {
    toggleCwMenu(1);
    toggleCwCardBody(1);
});
cwHeaderMenuFinalize.addEventListener('click', () => {
    toggleCwMenu(2);
    toggleCwCardBody(2);
});

const toggleCwMenu = (index) => {
    cwHeaderMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleCwCardBody = (index) => {
    cwCardBodies.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}


// socket io
const socket = io('/rollup');

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