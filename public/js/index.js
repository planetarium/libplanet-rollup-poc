const getElementById = (id) => document.getElementById(id) || null;

// Initializing
const headerMenuDeposit = getElementById('hm-d');
const headerMenuWithdraw = getElementById('hm-w');
const headerMenuBatchSubmit = getElementById('hm-v');
const headerMenus = [headerMenuDeposit, headerMenuWithdraw, headerMenuBatchSubmit];

const cardDeposit = getElementById('c-d');
const cardWithdraw = getElementById('c-w');
const cardBatchSubmit = getElementById('c-v');
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

const cvHeaderMenuSubmitBatch = getElementById('cv-hm-sb');
const cvHeaderMenuDerivate = getElementById('cv-hm-d');
const cvHeaderMenus = [cvHeaderMenuSubmitBatch, cvHeaderMenuDerivate];

const cvCardBodySubmitBatch = getElementById('cv-cb-sb');
const cvCardBodyDerivate = getElementById('cv-cb-d');
const cvCardBodies = [cvCardBodySubmitBatch, cvCardBodyDerivate];

cvHeaderMenuSubmitBatch.addEventListener('click', () => {
    toggleCvMenu(0);
    toggleCvCardBody(0);
});

cvHeaderMenuDerivate.addEventListener('click', () => {
    toggleCvMenu(1);
    toggleCvCardBody(1);
});

const toggleCvMenu = (index) => {
    cvHeaderMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleCvCardBody = (index) => {
    cvCardBodies.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

// socket setup
const socket = io('/rollup');

socket.on("connect", () => {
    console.log(socket.connected); // true
});

socket.on("disconnect", () => {
    console.log(socket.connected); // false
});

// socket data
const outputRootText = getElementById('ori-or');
const l2OutputIndexText = getElementById('ori-l2-oi');
const l2BlockNumberText = getElementById('ori-l2-bn');
const l1TimestampText = getElementById('ori-l1-ts');
socket.on('onOutputProposed', (data) => {
    outputRootText.value = data.outputRoot;
    l2OutputIndexText.value = data.l2OutputIndex;
    l2BlockNumberText.value = data.l2BlockNumber;
    l1TimestampText.value = data.l1Timestamp;
})

const firstAddressL1BalanceText = getElementById('fa-l1-b');
const firstAddressL2BalanceText = getElementById('fa-l2-b');
const secondAddressL1BalanceText = getElementById('sa-l1-b');
const secondAddressL2BalanceText = getElementById('sa-l2-b');
socket.on('onBalancesUpdated', (data) => {
    firstAddressL1BalanceText.value = data.l1FirstAddressBalance;
    firstAddressL2BalanceText.value = data.l2FirstAddressBalance;
    secondAddressL1BalanceText.value = data.l1SecondAddressBalance;
    secondAddressL2BalanceText.value = data.l2SecondAddressBalance;
});

// socket request
const cdDepositForm = getElementById('cd-df');
const cdDepositSubmitButton = getElementById('cd-ds');
const cdDepositResponseCardBody = getElementById('cd-dr-cb');

const cwWithdrawForm = getElementById('cw-wf');
const cwWithdrawSubmitButton = getElementById('cw-ws');
const cwWithdrawResponseCardBody = getElementById('cw-wr-cb');

const cwProveForm = getElementById('cw-pf');
const cwProveSubmitButton = getElementById('cw-ps');
const cwProveResponseCardBody = getElementById('cw-pr-cb');

const cwFinalizeForm = getElementById('cw-ff');
const cwFinalizeSubmitButton = getElementById('cw-fs');
const cwFinalizeResponseCardBody = getElementById('cw-fr-cb');

const cvSubmitBatchForm = getElementById('cv-sbf');
const cvSubmitBatchSubmitButton = getElementById('cv-sbs');
const cvSubmitBatchResponseCardBody = getElementById('cv-sbr-cb');

const init = () => {
    attachQueryLogsToForm(
        cdDepositForm, 
        cdDepositSubmitButton, 
        cdDepositResponseCardBody, 
        'onDepositRequested', 
        'onDepositLog'
    );

    attachQueryLogsToForm(
        cwWithdrawForm, 
        cwWithdrawSubmitButton, 
        cwWithdrawResponseCardBody, 
        'onWithdrawRequested', 
        'onWithdrawLog'
    );

    attachQueryLogsToForm(
        cwProveForm, 
        cwProveSubmitButton, 
        cwProveResponseCardBody, 
        'onProveRequested', 
        'onProveLog'
    );

    attachQueryLogsToForm(
        cwFinalizeForm, 
        cwFinalizeSubmitButton, 
        cwFinalizeResponseCardBody, 
        'onFinalizeRequested', 
        'onFinalizeLog'
    );

    attachQueryLogsToForm(
        cvSubmitBatchForm, 
        cvSubmitBatchSubmitButton, 
        cvSubmitBatchResponseCardBody, 
        'onSubmitBatchRequested', 
        'onSubmitBatchLog'
    );
}

// utility
const attachQueryLogsToForm = (
    form, submitButton, responseCardBody, socketEmitEvent, socketOnEvent
) => {
    submitButton.addEventListener('click', (e) => {
        const formData = new FormData(form);
        const data = formDataToJson(formData);
        if (!data) {
            return;
        }
    
        responseCardBody.innerHTML = '';
        socket.emit(socketEmitEvent, data);
    });
    socket.on(socketOnEvent, (text) => {
        var elem = responseCardBody;
        if (typeof text === 'object') {
            addPreElem(elem, balancesToText(text));
        } else {
            addPreElem(elem, text);
        }
    });
}

const addPreElem = (elem, text) => {
    const preElem = document.createElement('pre');
    preElem.style = 'color: white;';
    preElem.innerText = text;
    elem.appendChild(preElem);
}

const balancesToText = (balances) => {
    balanceLogData = {
        before: {
            l2FirstAddressBalance: firstAddressL1BalanceText.value,
            l3FirstAddressBalance: firstAddressL2BalanceText.value,
            l2SecondAddressBalance: secondAddressL1BalanceText.value,
            l3SecondAddressBalance: secondAddressL2BalanceText.value,
        },
        after: {
            l2FirstAddressBalance: balances.l2FirstAddressBalance,
            l3FirstAddressBalance: balances.l3FirstAddressBalance,
            l2SecondAddressBalance: balances.l2SecondAddressBalance,
            l3SecondAddressBalance: balances.l3SecondAddressBalance,
        }
    }

    return JSON.stringify(balanceLogData, null, 2);
}

const formDataToJson = (formData) => {
    const data = {};
    var valid = true;
    formData.forEach((value, key) => {
        if (value === '' || value === null) {
            valid = false;
            alert('All fields are required');
            return false;
        }
        data[key] = value;
    });
    if (!valid) {
        return false;
    }
    return data;
}

// init
init();