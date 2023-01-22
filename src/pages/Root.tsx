import React from 'react'
import {Box} from "grommet";
import { Web3Button } from '@web3modal/react'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from '../config'
import { ApplePay } from '../components/ApplePay';
import { WalletConnect } from '../components/WalletConnect';

const { walletConnect, stripe } = config

export const Root = () => {
    const stripePromise = loadStripe(stripe.pkKey)

    return <Box>
        <Elements stripe={stripePromise}>
            <Box direction={'row'} gap={'32px'}>
                {/*<ApplePay />*/}
                <WalletConnect projectId={walletConnect.projectId} />
            </Box>
        </Elements>
    </Box>
}
