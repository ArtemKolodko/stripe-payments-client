import { Web3Button, Web3Modal } from '@web3modal/react'
import { Box, Button, Text } from 'grommet'
import React, { useState, useEffect } from 'react'
import QRCode from "react-qr-code";
import { useAccount, useDisconnect } from 'wagmi'
import Web3 from 'web3'
import { Select } from 'antd';
import WalletConnect from "@walletconnect/browser";
import { ethereumClient } from '../utils'
import { ApplePay } from './ApplePay'
// import {ReactComponent as MetamaskLogo} from '../assets/metamask-fox.svg';
import styled from 'styled-components';

const payAmountOne = 50
const receiverAddress = '0xac29041489210563f02f95ad85Df2e033131aE77'

const qrConnector = new WalletConnect({
  bridge: "https://bridge.walletconnect.org",
});

// @ts-ignore
const isSafari = typeof window.safari !== 'undefined' || !!window.navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

enum PaymentMethod {
  pay = 'pay',
  qr = 'qr',
  walletConnect = 'walletConnect'
}

const SpaceWrapper = styled(Box)`
  padding: 16px;
  border: 1px solid rgba(5, 5, 5, 0.06);
  border-radius: 16px;
`

const ApplePayContainer = (props: { showHeader?: boolean }) => {
  const { showHeader = true } = props

  return <Box gap={'8px'}>
    {showHeader &&
        <Box align={'center'}>
          {(isSafari) ? 'Apple Pay' : 'Google Pay'}
        </Box>
    }
    <Box>
      <ApplePay />
    </Box>
  </Box>
}

const WalletConnectContainer = (props: { showHeader?: boolean }) => {
  const { showHeader = true } = props

  return <Box gap={'8px'}>
    {showHeader &&
        <Box align={'center'}>
            Connect Wallet
        </Box>
    }
    <Box>
      <Web3Button label="Connect Wallet" />
    </Box>
  </Box>
}

const QRCodeContainer = (props: { showHeader?: boolean, uri: string }) => {
  const { showHeader = true, uri } = props
  return <Box gap={'8px'}>
    {showHeader &&
        <Box align={'center'}>
            QR Code
        </Box>
    }
    <Box align={'center'} justify={'center'}>
      <QRCode
        size={96}
        value={uri}
      />
    </Box>
  </Box>
}

export const ConnectorsDemoPage = (props: { projectId: string }) => {
  const { isConnected, address, connector } = useAccount()
  const { disconnect } = useDisconnect()

  const [walletConnectURI, setWalletConnectURI] = useState('')
  const [walletConnectAddress, setWalletConnectAddress] = useState('')
  const [isPageReady, setPageReady] = useState(false)
  const [isQrConnected, setQrConnected] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>()

  const createWalletConnectUri = async () => {
    try {
      if(qrConnector.session.key) {
        await qrConnector.killSession({ message: 'close session' })
      }
      await qrConnector.createSession()
      // console.log('Wallet connect uri:', qrConnector.uri)
      setWalletConnectURI(qrConnector.uri)
    } catch (e) {
      console.error('Cannot create Wallet connect URI', (e as Error).message)
    }
  }

  const onQrWalletConnectEvent = (error: any, payload: any) => {
    const { accounts } = payload.params[0];

    if(accounts.length > 0) {
      setWalletConnectAddress(accounts[0])
      console.log('Set wallet connect success: ', accounts[0])
    }
    setQrConnected(true)
  }

  const onQrWalletDisconnect = () => {
    setQrConnected(false)
  }

  useEffect(() => {
    createWalletConnectUri()
    setTimeout(() => setPageReady(true), 1000)
    qrConnector.on("connect", onQrWalletConnectEvent.bind(this));
    qrConnector.on("disconnect", onQrWalletDisconnect.bind(this));
  }, [])

  useEffect(() => {
    // Don't show transaction popup on page load, only on connect provider
    if(isPageReady) {
      setTimeout(() => {
        sendTxHandler()
      }, 200)
    }
    if(!isConnected) {
      setTxHash('')
    }
  }, [isConnected, isQrConnected])

  const sendTxHandler = () => {
    if(isQrConnected) {
      sendWalletConnectTransaction()
    } else if(isConnected) {
      sendTransaction()
    }
  }

  const sendTransaction = async () => {
    try {
      const provider = await connector!.getProvider()
      const web3 = new Web3(provider)
      const amount = web3.utils.toWei(payAmountOne.toString(), 'ether');
      const transactionParameters = {
        gas: web3.utils.toHex(21000),
        gasPrice: web3.utils.toHex(1000 * 1000 * 1000 * 1000),
        to: receiverAddress,
        from: address,
        value: web3.utils.toHex(amount),
      };
      setIsConfirming(true)
      const tx = await web3.eth.sendTransaction(transactionParameters)
      setTxHash(tx.transactionHash)
    } catch (e) {
      console.log('Cannot send tx:', e)
    } finally {
      setIsConfirming(false)
    }
  }

  const sendWalletConnectTransaction = async () => {
    try {
      const web3 = new Web3('https://api.harmony.one')
      const amount = web3.utils.toWei(payAmountOne.toString(), 'ether');
      const transactionParameters = {
        to: receiverAddress,
        from: walletConnectAddress,
        data: "0x",
        gasLimit: web3.utils.toHex(21000),
        gasPrice: web3.utils.toHex(1000 * 1000 * 1000 * 1000),
        value: web3.utils.toHex(amount),
      };
      setIsConfirming(true)
      const tx = await qrConnector.sendTransaction(transactionParameters)
      console.log('tx:', tx)
      setTxHash(tx.transactionHash)
    } catch (e) {
      console.log('Cannot send tx:', e)
    } finally {
      setIsConfirming(false)
    }
  }

  return <Box>
    <Box>
      <Box direction={'row'} gap={'8px'}>
        <Box>
          <Box>
            <Box direction={'row'} wrap={true} style={{ gap: '2em' }}>
              <ApplePayContainer />
              <WalletConnectContainer />
              <QRCodeContainer uri={walletConnectURI} />
            </Box>
          </Box>
        </Box>
      </Box>
      {(isConnected || isQrConnected) && <Box gap={'32px'} margin={{ top: '64px' }}>
          <Box width={'200px'}>
              <Button primary disabled={isConfirming} onClick={sendTxHandler}>
                {isConfirming ? 'Confirming tx...' : `Pay (${payAmountOne} ONE)`}
              </Button>
          </Box>
        {txHash &&
            <Box>
                <Text><a href={`https://explorer.harmony.one/tx/${txHash}`} target={'_blank'}>Show transaction in Explorer</a></Text>
            </Box>
        }
      </Box>}
      {(isConnected || isQrConnected) &&
          <Box margin={{ top: '32px' }}>
              <Text onClick={async () => {
                disconnect()
                if(isQrConnected) {
                  await qrConnector.killSession({ message: 'close session' })
                }
              }} style={{ textDecoration: 'underline', color: 'lightgrey', cursor: 'pointer' }}>Disconnect</Text>
          </Box>
      }
    </Box>
    <SpaceWrapper margin={{ top: '32px' }} width={'252px'}>
      <Box>
        <Select
          placeholder={'Select payment option'}
          options={[
            { value: PaymentMethod.pay, label: isSafari ? 'Apple Pay' : 'Google Pay' },
            { value: PaymentMethod.qr, label: 'QR Code' },
            { value: PaymentMethod.walletConnect, label: 'Connect Wallet' },
          ]}
          onChange={(value: PaymentMethod) => setSelectedMethod(value)}
        />
      </Box>
      <Box margin={{ top: '16px', bottom: '8px' }} align={'center'}>
        {selectedMethod === PaymentMethod.pay &&
            <ApplePayContainer showHeader={false} />
        }
        {selectedMethod === PaymentMethod.walletConnect &&
          <WalletConnectContainer showHeader={false} />
        }
        {selectedMethod === PaymentMethod.qr &&
            <QRCodeContainer showHeader={false} uri={walletConnectURI} />
        }
      </Box>
    </SpaceWrapper>
    <Web3Modal
      projectId={props.projectId}
      ethereumClient={ethereumClient}
      themeBackground={'themeColor'}
    />
  </Box>
}
