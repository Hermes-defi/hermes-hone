
async function accountLoad() {
    if (window.ethereum) {
        const r = await window.ethereum.request({method: 'eth_requestAccounts'});
        web3 = new Web3(window.ethereum);
        account = r[0];
        return true;
    }
    return false;
}

async function main(){
    const enabled = await accountLoad();
    if( enabled ){
        $('#account').val(account);
        initContract();
    }else{
        $('#ethEnabled').html('no')
    }
}
async function initContract(){
    contract = new web3.eth.Contract(abi, $('#contract').val() );
    const blockNumber = await web3.eth.getBlockNumber();
    $('#blockNumber').html('Block: '+blockNumber);

    const epoch = await contract.methods.epoch().call();
    $('#epoch').html('Epoch: '+epoch);

    balanceOf(account);
    showLastDeposits();
    showLastAdvances();
    showLastCollectReward();
    showAPR();
}
async function showAPR(){
    const balance = await contract.methods.balance().call();
    const _reward = await contract.methods.rewardStatsLastReward().call();
    const interval = await contract.methods.rewardStatsTimeInterval().call();
    const bal = web3.utils.fromWei(balance);
    if( _reward > 0 && bal > 0 ){
        // just convert 1028928382382 to 1.02
        const reward = web3.utils.fromWei(_reward);

        // get reward per second
        const aprPerSec = parseFloat(reward/interval).toFixed(18);

        // get the reward in 30 days
        const aprPerDay = aprPerSec * 89400 * 30;

        // get % of 30 days and mul by 12 to get by year
        const apr = (aprPerDay/bal)*100 * 12;
        // console.log('apr', apr, 'seconds', interval, 'aprPerSec', aprPerSec);
        $('#apr').html('APR: '+apr.toFixed(2) + '%');
    }
    $('#balance').html('balance: '+parseFloat(bal).toFixed(6)+' ONE');

}
async function showLastDeposits(){
    const lastBlock = await web3.eth.getBlockNumber();
    const from = lastBlock - 1000;
    contract.getPastEvents('Deposit', {fromBlock: from, toBlock: lastBlock},
        function(err, ev){
            if(err){
                console.error(err);
            }else{
                // console.log(ev);
                let html = '';
                for( let i in ev ){
                    const e = ev[i];
                    const r = e.returnValues;
                    // console.log(r);
                    // web3.utils.fromWei(new web3.utils.BN(receipt.logs[0].args.amount))
                    const amount = web3.utils.fromWei(r.amount);
                    const status = r.status;
                    const user = r.user.substr(r.user.length-4);
                    console.log(user, amount, status);
                    html += '<li class="list-group-item">...'+user+' = '+amount+' hONE</li>'
                }
                $('#eventsDeposits').html(html);
            }

        });
}

async function advance(){
    try {
        await contract.methods.advance().estimateGas({from: account},
            async function(error, gasAmount){
                if( error ){
                    alert( error.toString() );
                }else{
                    await contract.methods.advance().send({from: account});
                    await showLastAdvances();
                }
            });
    } catch (e) {
        alert(e.toString());
    }
}

async function showLastAdvances(){
    const lastBlock = await web3.eth.getBlockNumber();
    const from = lastBlock - 1000;
    contract.getPastEvents('Advance', {fromBlock: from, toBlock: lastBlock},
        function(err, ev){
            console.log(err, ev);
            if(err){
                console.error(err);
            }else{
                // console.log(ev);
                let html = '';
                for( let i in ev ){
                    const e = ev[i];
                    const r = e.returnValues;
                    console.log(r);
                    const reward = web3.utils.fromWei(r.reward);
                    const incentive = web3.utils.fromWei(r.incentive);
                    const balance = web3.utils.fromWei(r.balance);
                    const user = r.user.substr(r.user.length-4);
                    //console.log(user, amount, status);
                    html += '<li class="list-group-item">...'+user+','+reward+', '+incentive+', '+balance+'</li>'
                }
                $('#eventsAdvance').html(html);
            }

        });
}

async function showLastCollectReward(){
    const lastBlock = await web3.eth.getBlockNumber();
    const from = lastBlock - 1024;
    contract.getPastEvents('CollectReward', {fromBlock: from, toBlock: lastBlock},
        function(err, ev){
            console.log(err, ev);
            if(err){
                console.error(err);
            }else{
                // console.log(ev);
                let html = '';
                for( let i in ev ){
                    const e = ev[i];
                    const r = e.returnValues;
                    console.log('CollectReward', r);

                    let reward = r.reward ? r.reward.toString() : '0';
                        reward = web3.utils.fromWei(reward);
                    const ttl = r.interval;
                    const status = r.status ? 'OK' : 'ERR';
                    //console.log(user, amount, status);
                    html += '<li class="list-group-item">'+reward+' ONE - '+toHHMMSS(ttl)+' '+status+'</li>'
                }
                $('#eventsCollectReward').html(html);
            }

        });
}

async function balanceOf(address){
    try {
        const amount = await contract.methods.balanceOf(address).call();
        const _staked = await contract.methods._staked(address).call();
        const _stakedIn = await contract.methods._stakedIn(address).call();
        const value = web3.utils.fromWei(amount);
        const staked = web3.utils.fromWei(_staked);
        const stakedIn = parseInt(_stakedIn);

        $('#balanceOf').html(value);
        $('#staked').html(staked);
        $('#staked1').html(staked);
        $('#unstakeAmount').val(value);
        if( stakedIn > 0 ){
            const withdrawTimestamp = parseInt( await contract.methods.withdrawTimestamp().call() );
            const now = parseInt(new Date().getTime()/1000);
            const ttl = (stakedIn+withdrawTimestamp) - now;
            const unstakeInfo = ttl > 0 ? toHHMMSS(ttl) : 'available';
            $('#stakedIn').html( unstakeInfo );
            $('#stakedIn1').html( unstakeInfo );
            $('#withdraw').val(staked);

            const canWithdraw = await contract.methods.canWithdraw(account, _staked).call();
            console.log(canWithdraw.allowedToWithdraw);
            console.log(canWithdraw.Reason);
            $('#withdrawBtn').prop('disabled', ! canWithdraw.allowedToWithdraw);
            $('#withdrawInfo').html(canWithdraw.Reason);

        }else{
            $('#stakedIn').html('?');
            $('#stakedIn1').html('?');
            $('#withdraw').val('0');
        }

    } catch (e) {
        console.log(e);
    }
}
async function stake(amount){
    const value = web3.utils.toWei(amount);
    try {
        await contract.methods.deposit().estimateGas({from: account, value: value},
            async function(error, gasAmount){
                if( error ){
                    alert( error.toString() );
                }else{
                    await contract.methods.deposit().send({from: account, value: value});
                    await balanceOf(account);
                }
            });
    } catch (e) {
        alert(e.toString());
    }
}
async function unstake(_share){
    const value = web3.utils.toWei(_share);
    try {
        await contract.methods.unstake(value).estimateGas({from: account},
            async function(error, gasAmount){
                if( error ){
                    alert( error.toString() );
                }else{
                    await contract.methods.unstake(value).send({from: account});
                    await balanceOf(account);
                }
            });
    } catch (e) {
        alert(e.toString());
    }
}

async function withdraw(_share){
    const value = parseInt(_share * 1e18).toString();
    try {
        await contract.methods.withdraw(value).estimateGas({from: account},
            async function(error, gasAmount){
                if( error ){
                    alert( error.toString() );
                }else{
                    await contract.methods.withdraw(value).send({from: account});
                    await balanceOf(account);
                }
            });
    } catch (e) {
        alert(e.toString());
    }
}

function toHHMMSS (str) {
    let sec_num = parseInt(str, 10); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}
