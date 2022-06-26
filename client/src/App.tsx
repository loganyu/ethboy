import * as React from "react";
import styled from "styled-components";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { IInternalEvent } from "@walletconnect/types";
import Button from "./components/Button";
import Column from "./components/Column";
import Wrapper from "./components/Wrapper";
import Modal from "./components/Modal";
import Header from "./components/Header";
import Loader from "./components/Loader";
import { fonts } from "./styles";
import { apiGetAccountAssets, apiGetGasPrices, apiGetAccountNonce } from "./helpers/api";
import {
  sanitizeHex,
  verifySignature,
  hashTypedDataMessage,
  hashMessage,
} from "./helpers/utilities";
import { convertAmountToRawNumber, convertStringToHex } from "./helpers/bignumber";
import { IAssetData } from "./helpers/types";
import Banner from "./components/Banner";
import AccountAssets from "./components/AccountAssets";
import { eip712 } from "./helpers/eip712";
import 'bootstrap/dist/css/bootstrap.min.css';

// EPNS
import { NotificationItem, api, utils } from "@epnsproject/frontend-sdk-staging";

// Bootstrap
import Nav from 'react-bootstrap/Nav';
import BootstrapButton from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';

const SLayout = styled.div`
  position: relative;
  width: 100%;
  /* height: 100%; */
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper as any)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SLanding = styled(Column as any)`
  height: 600px;
`;

const SButtonContainer = styled(Column as any)`
  width: 250px;
  margin: 50px 0;
`;

const SConnectButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SModalContainer = styled.div`
  width: 100%;
  position: relative;
  word-wrap: break-word;
`;

const SModalTitle = styled.div`
  margin: 1em 0;
  font-size: 20px;
  font-weight: 700;
`;

const SModalParagraph = styled.p`
  margin-top: 30px;
`;

const SBalances = styled(SLanding as any)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

const STable = styled(SContainer as any)`
  flex-direction: column;
  text-align: left;
`;

const SRow = styled.div`
  width: 100%;
  display: flex;
  margin: 6px 0;
`;

const SKey = styled.div`
  width: 30%;
  font-weight: 700;
`;

const SValue = styled.div`
  width: 70%;
  font-family: monospace;
`;

const STestButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const STestButton = styled(Button as any)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  max-width: 175px;
  margin: 12px;
`;

const collectionBySlug = {
  'tiny-dinos-eth': {name: 'tiny dinos (eth)', image: 'https://lh3.googleusercontent.com/ZoC0EZPOaQeMGdAmqXh-PbOqEdrINf37NnD7wxI8FRa0Ymt8corMCzOP0xMPXjx2P12cvB6pDLWWnPSFJ1cOwbjqZc2_c3haN3n_8A=s168'},
  'cool-cats-nft': {name: 'Cool Cats NFT', image: 'https://lh3.googleusercontent.com/LIov33kogXOK4XZd2ESj29sqm_Hww5JSdO7AFn5wjt8xgnJJ0UpNV9yITqxra3s_LMEW1AnnrgOVB_hDpjJRA1uF4skI5Sdi_9rULi8=s168'},
  'doodles-official': {name: 'Doodles', image: 'https://lh3.googleusercontent.com/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ=s168'},
  'moonrunnersnft': {name: 'Moonrunners Official', image: 'https://openseauserdata.com/files/061eb8949cff84d0be850fc9a566e4fe.png'},
  'proof-moonbirds': {name: 'Moonbirds', image: 'https://lh3.googleusercontent.com/H-eyNE1MwL5ohL-tCfn_Xa1Sl9M9B4612tLYeUlQubzt4ewhr4huJIR5OLuyO3Z5PpJFSwdm7rq-TikAh7f5eUw338A2cy6HRH75=s168'},
  'cryptopunks': {name: 'CryptoPunks', image: 'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE=s168'},
  'boredapeyachtclub': {name: 'Bored Ape Yacht Club', image: 'https://lh3.googleusercontent.com/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB=s168'},
  'mutant-ape-yacht-club': {name: 'Mutant Ape Yacht Club', image: 'https://lh3.googleusercontent.com/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPFoG53VnLJezYi8hAs0OxNZwlw6Y-dmI=s168'},
  'mfers': {name: 'mfers', image: 'https://lh3.googleusercontent.com/J2iIgy5_gmA8IS6sXGKGZeFVZwhldQylk7w7fLepTE9S7ICPCn_dlo8kypX8Ju0N6wvLVOKsbP_7bNGd8cpKmWhFQmqMXOC8q2sOdqw=s168'},
}

interface IAppState {
  connector: WalletConnect | null;
  fetching: boolean;
  connected: boolean;
  chainId: number;
  showModal: boolean;
  pendingRequest: boolean;
  uri: string;
  accounts: string[];
  address: string;
  result: any | null;
  assets: IAssetData[];
  notifications: any[];
  activeTab: string;
  loadingNotifications: boolean;
  loadingSubscriptions: boolean;
  subscriptions: any[];
  formNotification: string;
  formCollection: string;
}

const INITIAL_STATE: IAppState = {
  connector: null,
  fetching: false,
  connected: false,
  chainId: 1,
  showModal: false,
  pendingRequest: false,
  uri: "",
  accounts: [],
  address: "",
  result: null,
  assets: [],
  notifications: [],
  activeTab: 'subscriptions',
  loadingNotifications: true,
  loadingSubscriptions: true,
  subscriptions: [],
  formNotification: '',
  formCollection: ''
};

class App extends React.Component<any, any> {
  public state: IAppState = {
    ...INITIAL_STATE,
  };

  public connect = async () => {
    // bridge url
    const bridge = "https://bridge.walletconnect.org";

    // create new connector
    const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });

    await this.setState({ connector });

    // check if already connected
    if (!connector.connected) {
      // create new session
      await connector.createSession();
    }

    // subscribe to events
    await this.subscribeToEvents();
  };
  public subscribeToEvents = () => {
    const { connector } = this.state;

    if (!connector) {
      return;
    }

    connector.on("session_update", async (error, payload) => {
      console.log(`connector.on("session_update")`);

      if (error) {
        throw error;
      }

      const { chainId, accounts } = payload.params[0];
      this.onSessionUpdate(accounts, chainId);
    });

    connector.on("connect", (error, payload) => {
      console.log(`connector.on("connect")`);

      if (error) {
        throw error;
      }

      this.onConnect(payload);
    });

    connector.on("disconnect", (error, payload) => {
      console.log(`connector.on("disconnect")`);

      if (error) {
        throw error;
      }

      this.onDisconnect();
    });

    if (connector.connected) {
      const { chainId, accounts } = connector;
      const address = accounts[0];
      
      this.setState({
        connected: true,
        chainId,
        accounts,
        address,
      });
      this.onSessionUpdate(accounts, chainId);
    }

    this.setState({ connector });
  };

  public killSession = async () => {
    const { connector } = this.state;
    if (connector) {
      connector.killSession();
    }
    this.resetApp();
  };

  public resetApp = async () => {
    await this.setState({ ...INITIAL_STATE });
  };

  public onConnect = async (payload: IInternalEvent) => {
    const { chainId, accounts } = payload.params[0];
    const address = accounts[0];
    await this.setState({
      connected: true,
      chainId,
      accounts,
      address,
    });
    this.getAccountAssets();
    this.getPushSubscriptions();
    this.getPushNotifications();
  };

  public onDisconnect = async () => {
    this.resetApp();
  };

  public onSessionUpdate = async (accounts: string[], chainId: number) => {
    const address = accounts[0];
    await this.setState({ chainId, accounts, address });
    await this.getAccountAssets();
    await this.getPushSubscriptions();
    await this.getPushNotifications();
  };

  public getAccountAssets = async () => {
    const { address, chainId } = this.state;
    this.setState({ fetching: true });
    try {
      // get account balances
      const assets = await apiGetAccountAssets(address, chainId);

      await this.setState({ fetching: false, address, assets });
    } catch (error) {
      console.error(error);
      await this.setState({ fetching: false });
    }
  };

  public getPushNotifications = async () => {
    console.log('start getPushNotifications')
    this.setState({loadingNotifications: true})
    // define the variables required to make a request
    const walletAddress = this.state.address
    const pageNumber = 1;
    const itemsPerPage = 20;

    // fetch the notifications
    const {count, results} = await api.fetchNotifications(walletAddress, itemsPerPage, pageNumber)
    console.log('count: ', count)
    console.log({results});

    // parse all the fetched notifications
    const parsedResponse = utils.parseApiResponse(results);
    console.log(parsedResponse);
    this.setState({notifications: parsedResponse, loadingNotifications: false});
  }

  public getPushSubscriptions = 
  async () => {
    console.log('start getPushSubscriptions')
    this.setState({loadingSubscriptions: true})
    const walletAddress = this.state.address

    fetch(`/api/notifications/${walletAddress}`).then(res => res.json())
      .then(subscriptions => this.setState({subscriptions: subscriptions.reverse(), loadingSubscriptions: false}));
  }

  public deleteSubscription = (subscription) => {
    const address = this.state.address;
    const collectionSlug = subscription[0];
    const notifyType = subscription[1];

    fetch('/api/remove_notification', {method: 'POST', body: JSON.stringify({
      address, collectionSlug, notifyType
    })})

    this.setState({subscriptions: this.state.subscriptions.filter((s) => s !== subscription)})
  }

  public toggleModal = () => this.setState({ showModal: !this.state.showModal });

  public testSendTransaction = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // from
    const from = address;

    // to
    const to = address;

    // nonce
    const _nonce = await apiGetAccountNonce(address, chainId);
    const nonce = sanitizeHex(convertStringToHex(_nonce));

    // gasPrice
    const gasPrices = await apiGetGasPrices();
    const _gasPrice = gasPrices.slow.price;
    const gasPrice = sanitizeHex(convertStringToHex(convertAmountToRawNumber(_gasPrice, 9)));

    // gasLimit
    const _gasLimit = 21000;
    const gasLimit = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 0;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      nonce,
      gasPrice,
      gasLimit,
      value,
      data,
    };

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await connector.sendTransaction(tx);

      // format displayed result
      const formattedResult = {
        method: "eth_sendTransaction",
        txHash: result,
        from: address,
        to: address,
        value: `${_value} ETH`,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testSignTransaction = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // from
    const from = address;

    // to
    const to = address;

    // nonce
    const _nonce = await apiGetAccountNonce(address, chainId);
    const nonce = sanitizeHex(convertStringToHex(_nonce));

    // gasPrice
    const gasPrices = await apiGetGasPrices();
    const _gasPrice = gasPrices.slow.price;
    const gasPrice = sanitizeHex(convertStringToHex(convertAmountToRawNumber(_gasPrice, 9)));

    // gasLimit
    const _gasLimit = 21000;
    const gasLimit = sanitizeHex(convertStringToHex(_gasLimit));

    // value
    const _value = 0;
    const value = sanitizeHex(convertStringToHex(_value));

    // data
    const data = "0x";

    // test transaction
    const tx = {
      from,
      to,
      nonce,
      gasPrice,
      gasLimit,
      value,
      data,
    };

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await connector.signTransaction(tx);

      // format displayed result
      const formattedResult = {
        method: "eth_signTransaction",
        from: address,
        to: address,
        value: `${_value} ETH`,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testLegacySignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // hash message
    const hash = hashMessage(message);

    // eth_sign params
    const msgParams = [address, hash];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signMessage(msgParams);

      // verify signature
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "eth_sign (legacy)",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testStandardSignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // eth_sign params
    const msgParams = [address, hexMsg];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signMessage(msgParams);

      // verify signature
      const hash = hashMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "eth_sign (standard)",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testPersonalSignMessage = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    // test message
    const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    // eth_sign params
    const msgParams = [hexMsg, address];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await connector.signPersonalMessage(msgParams);

      // verify signature
      const hash = hashMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "personal_sign",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public testSignTypedData = async () => {
    const { connector, address, chainId } = this.state;

    if (!connector) {
      return;
    }

    const message = JSON.stringify(eip712.example);

    // eth_signTypedData params
    const msgParams = [address, message];

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // sign typed data
      const result = await connector.signTypedData(msgParams);

      // verify signature
      const hash = hashTypedDataMessage(message);
      const valid = await verifySignature(address, result, hash, chainId);

      // format displayed result
      const formattedResult = {
        method: "eth_signTypedData",
        address,
        valid,
        result,
      };

      // display result
      this.setState({
        connector,
        pendingRequest: false,
        result: formattedResult || null,
      });
    } catch (error) {
      console.error(error);
      this.setState({ connector, pendingRequest: false, result: null });
    }
  };

  public setActiveTab = (activeTab) => {
    this.setState({activeTab})
  }

  public handleSubmit = async (event) => {
    event.preventDefault();
    const address = this.state.address;
    const collectionSlug = this.state.formCollection;
    const notifyType = this.state.formNotification;

    await fetch('/api/create_notification', {method: 'POST', body: JSON.stringify({
      address, collectionSlug, notifyType
    })})

    await this.getPushSubscriptions()
    await this.setState({activeTab: 'subscriptions'})

  }

  public setFormCollection = (value) => {
    this.setState({formCollection: value})

  }

  public setFormNotification = (value) => {
    this.setState({formNotification: value})
  }

  public render = () => {
    const {
      assets,
      address,
      connected,
      chainId,
      fetching,
      showModal,
      pendingRequest,
      result,
      notifications,
      activeTab,
      loadingNotifications,
      loadingSubscriptions,
      subscriptions
    } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.killSession}
            notifications={notifications}
          />
          <SContent>
            {!address && !assets.length ? (
              <SLanding center>
                <h3>
                  {`Manage EPNS Notifications with EthBoy! (◠‿◠)`}
                </h3>
                <SButtonContainer>
                  <SConnectButton left onClick={this.connect} fetching={fetching}>
                    {"Connect to WalletConnect"}
                  </SConnectButton>
                </SButtonContainer>
              </SLanding>
            ) : (
              <SBalances>
                <Container>
                  <Row>
                    <Col>
                      <BootstrapButton onClick={() => this.setActiveTab('subscriptions')} variant="outline-primary" active={activeTab==="subscriptions"}>
                        Subscriptions
                      </BootstrapButton>
                    </Col>
                    <Col>
                      <BootstrapButton onClick={() => this.setActiveTab('create')} variant="outline-primary" active={activeTab==="create"}>
                        Create Subscription
                      </BootstrapButton>
                    </Col>
                    <Col>
                      <BootstrapButton onClick={() => this.setActiveTab('notifications')}variant="outline-primary" active={activeTab==="notifications"}>
                        Notifications
                      </BootstrapButton>
                    </Col>
                  </Row>
                  {activeTab === 'subscriptions' && 
                    <>
                      <h3>Subscriptions</h3>
                      {
                        !loadingSubscriptions ?
                          <>
                            {subscriptions.length === 0 && !loadingSubscriptions &&
                              <div>You have no subscriptions</div>}
                            {subscriptions.length !== 0 && !loadingSubscriptions &&
                            <Table striped bordered hover size="sm">
                                <thead>
                                  <tr>
                                    <th />
                                    <th>Collection</th>
                                    <th>Notification Type</th>
                                    <th />
                                  </tr>
                                </thead>
                                <tbody>

                                  {subscriptions.map(sub => (
                                    <tr>
                                      <td><img width="32" height="32" src={collectionBySlug[sub[0]].image} /></td>
                                      <td>{collectionBySlug[sub[0]].name}</td>
                                      <td>{sub[1]}</td>
                                      <td>
                                        <BootstrapButton onClick={() => this.deleteSubscription(sub)}  variant="danger">Delete</BootstrapButton>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            }
                          </>
                          :
                          <Column center>
                            <SContainer>
                              <Loader />
                            </SContainer>
                          </Column>
                      }
                    </>
                  }
                  {activeTab === 'notifications' && 
                    <>
                      <h3>Notifications</h3>
                      {
                        !loadingNotifications ?

                          notifications.map(oneNotification => (
                            <span key={oneNotification.sid}>
                              {oneNotification.title} - {oneNotification.message}
                            </span>
                          ))
                          :
                          <Column center>
                            <SContainer>
                              <Loader />
                            </SContainer>
                          </Column>
                      }
                    </>
                  }
                  {activeTab === 'create' && 
                    <>
                      <h3>Create Subscription</h3>
                      <Form onSubmit={this.handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                          <Form.Label>Collection</Form.Label>
                          <Form.Select aria-label="Default select example" onChange={event => this.setFormCollection(event.target.value)}>
                            <option>Select a collection</option>
                            <option value="tiny-dinos-eth">tiny dinos (eth)</option>
                            <option value="cool-cats-nft">Cool Cats NFT</option>
                            <option value="doodles-official">Doodles</option>
                            <option value="moonrunnersnft">Moonrunners Official</option>
                            <option value="proof-moonbirds">Moonbirds</option>
                            <option value="cryptopunks">CryptoPunks</option>
                            <option value="boredapeyachtclub">Bored Ape Yacht Club</option>
                            <option value="mutant-ape-yacht-club">Mutant Ape Yacht Club</option>
                            <option value="mfers">mfers</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                          <Form.Label>Notification</Form.Label>
                          <Form.Select aria-label="Default select example" onChange={event => this.setFormNotification(event.target.value)}>
                            <option>Select a notification</option>
                            <option value="listed">listed</option>
                            <option value="sold">sold</option>
                            <option value="transferred">transferred</option>
                            <option value="metadataUpdates">metadataUpdates</option>
                            <option value="cancelled">cancelled</option>
                            <option value="receivedOffer">receivedOffer</option>
                            <option value="receivedBid">receivedBid</option>
                          </Form.Select>
                        </Form.Group>
                        <BootstrapButton variant="primary" type="submit">
                          Submit
                        </BootstrapButton>
                      </Form>
                    </>
                  }
                </Container>
              </SBalances>
            )}
          </SContent>
        </Column>
        <Modal show={showModal} toggleModal={this.toggleModal}>
          {pendingRequest ? (
            <SModalContainer>
              <SModalTitle>{"Pending Call Request"}</SModalTitle>
              <SContainer>
                <Loader />
                <SModalParagraph>{"Approve or reject request using your wallet"}</SModalParagraph>
              </SContainer>
            </SModalContainer>
          ) : result ? (
            <SModalContainer>
              <SModalTitle>{"Call Request Approved"}</SModalTitle>
              <STable>
                {Object.keys(result).map(key => (
                  <SRow key={key}>
                    <SKey>{key}</SKey>
                    <SValue>{result[key].toString()}</SValue>
                  </SRow>
                ))}
              </STable>
            </SModalContainer>
          ) : (
            <SModalContainer>
              <SModalTitle>{"Call Request Rejected"}</SModalTitle>
            </SModalContainer>
          )}
        </Modal>
      </SLayout>
    );
  };
}

export default App;
