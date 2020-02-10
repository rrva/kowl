import React, { PureComponent } from 'react';
import { observer } from "mobx-react"
import { Layout, Menu, Icon, Select, PageHeader, Alert, Button, Avatar } from 'antd';
import { uiSettings } from '../state/ui';
import { CreateRouteMenuItems, APP_ROUTES, RouteView, } from './routes';
import { RenderTrap, Spacer } from './misc/common';
import { DebugTimerStore, hoursToMilliseconds } from '../utils/utils';
import { api } from '../state/backendApi';
import { NavLink, Switch, Route } from 'react-router-dom';
import { Route as AntBreadcrumbRoute } from 'antd/lib/breadcrumb/Breadcrumb';
import { MotionAlways, MotionDiv } from '../utils/animationProps';
import { ErrorDisplay } from './misc/ErrorDisplay';
import prettyMilliseconds from 'pretty-ms';
import { uiState } from '../state/uiState';
import { appGlobal } from '../state/appGlobal';
import Title from 'antd/lib/typography/Title';

import logo2 from '../assets/logo2.png';
import gitHubLogo from '../assets/GitHub-Mark-Light-32px.png';
import { ErrorBoundary } from './misc/ErrorBoundary';
import { IsDevelopment, IsProduction } from '../utils/isProd';
import { TopBar } from './misc/TopBar';
import { isBusinessVersion } from '..';
import fetchWithTimeout from '../utils/fetchWithTimeout';
import { UserData } from '../state/restInterfaces';
import Login from './misc/login';
import LoginCompletePage from './misc/login-complete';
import env, { getBuildDate } from '../utils/env';

const { Content, Footer, Sider, Header } = Layout;
const { Option } = Select;

let siderCollapsedWidth = 80;


const SideBar = observer(() =>
    <Layout style={{ display: 'flex', flex: 1, height: '100vh', flexDirection: 'column', background: 'linear-gradient(180deg, hsla(206, 60%, 17%, 0.95) 0%, #08273ef5 94.27%) no-repeat' }}>
        <RenderTrap name='SideBarContent' />

        {/* Logo */}
        <div style={{ background: 'rgba(0,0,0, 0)', padding: '1px' }}>
            {/* <div style={{ background: 'none', borderRadius: 4, display: 'flex', placeItems: 'center', placeContent: 'center' }}>
                <span style={{ fontSize: '1.5em', color: 'white' }}>PLACEHOLDER</span>
            </div> */}
            <div style={{ position: 'relative' }}>
                <img src={logo2} style={{
                    width: 'auto', height: '130px', display: 'block', margin: 'auto', cursor: 'pointer',
                    opacity: 0.5, mixBlendMode: 'overlay',
                    marginTop: '3em'
                }}
                    onClick={() => { appGlobal.history.push('/'); }}
                />
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    width: '100%',

                    fontFamily: "'Quicksand', sans-serif",
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '6px',
                    transform: 'translateX(4px)',
                    fontSize: '1.8rem',
                    textAlign: 'center',
                    color: 'hsla(205, 47%, 36%, 1)',
                }}>
                    Kowl
                </div>
                <div style={{ position: 'relative', borderTop: '1px solid #fff3', margin: '.5em 1em', marginTop: '1em' }} />
            </div>
        </div>

        {/* Menu */}
        <Content className="scroll-on-hover-y">
            <Menu mode="inline"
                theme='dark'
                selectedKeys={uiState.selectedMenuKeys}
                style={{ border: 0, background: 'none' }}
            >
                {CreateRouteMenuItems(APP_ROUTES)}
            </Menu>
        </Content>

        {/* Version */}
        <div className='version'>
            <div className='repo'><a title="Visit Kafka-Owl's GitHub repository" href="https://github.com/kafka-owl/kafka-owl"><img src={gitHubLogo} /></a></div>
            <div>KafkaOwl - {env.REACT_APP_GIT_REF || 'dev'}-{env.REACT_APP_GIT_SHA.slice(0, 8) || '??'}</div>
            <div>Built {getBuildDate()}</div>
        </div>

        {/* Toggle */}
        <Footer style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            height: '40px', padding: 0, background: 'rgba(0,0,0, 0.25)', cursor: 'pointer'
        }} onClick={() => { uiSettings.sideBarOpen = !uiSettings.sideBarOpen }}>
            <Icon type={uiSettings.sideBarOpen ? 'menu-fold' : 'menu-unfold'} style={{ fontSize: '19px', color: '#1f6190' }} />
        </Footer>
    </Layout>
)

const AppSide = observer(() => (
    <Sider collapsible collapsed={!uiSettings.sideBarOpen} collapsedWidth={siderCollapsedWidth} trigger={null} style={{ background: 'white', cursor: 'default' }}>
        <SideBar />
    </Sider>
))



const DataAgeInfo = observer(() => {
    const size = '19px'

    DebugTimerStore.Instance.useFrame();

    const maxFetchTime = api.ActiveRequests.length == 0
        ? 0
        : api.ActiveRequests.map(r => r.requestTime).reduce((p, c) => Math.max(p, c));

    // maybe we need to use the same 'no vertical expansion' trick:
    // <span >
    return (
        <div style={{ color: 'hsl(205, 100%, 50%)', display: 'flex', alignItems: 'center', height: '2em' }} className='fadeIn' >

            {maxFetchTime < 0.1
                ?
                <>
                    <Button icon='reload' shape='circle' className='hoverButton' style={{ color: 'hsl(205, 100%, 50%)', background: 'transparent' }} onClick={() => appGlobal.onRefresh()} />
                    {/* <span style={{ paddingLeft: '.2em', fontSize: '80%' }}>fetched <b>1 min</b> ago</span> */}
                </>
                :
                <>
                    <span className='spinner' style={{ marginLeft: '.5em', width: size, height: size }} />
                    <span className='pulsating' style={{ paddingLeft: '0.8em', fontSize: '80%' }}>Fetching data...</span>
                </>
            } </div>
    )
})

const AppPageHeader = observer(() => {

    let breadcrumbs = uiState.pageBreadcrumbs.map(v => ({ path: v.linkTo, breadcrumbName: v.title }));

    const selectedClusterName = uiState.selectedClusterName;
    if (selectedClusterName) {
        //const rootBreadcrumb: AntBreadcrumbRoute = { path: '', breadcrumbName: selectedClusterName };
        const rootBreadcrumb: AntBreadcrumbRoute = { path: '', breadcrumbName: 'Cluster' };
        breadcrumbs.unshift(rootBreadcrumb);
    }

    const itemRender = (r: AntBreadcrumbRoute) => <NavLink to={r.path}>{r.breadcrumbName}</NavLink>;

    return <MotionDiv identityKey={uiState.pageTitle}>
        <PageHeader
            style={{ paddingLeft: '1rem', paddingRight: 0, marginBottom: '4rem' }}
            breadcrumb={{ routes: breadcrumbs, itemRender: itemRender, separator: '>' }}
            // onBack={onBack}
            title={<><Title level={3}>{uiState.pageTitle}</Title></>}
            subTitle={<DataAgeInfo />}
            footer={<></>}
            extra={uiState.pageHeaderExtra()} // right sider
        />
    </MotionDiv>
});

const AppContent = observer(() =>
    <Layout style={{ borderLeft: '1px solid #ddd', overflow: 'hidden' }}>

        <RenderTrap name='AppContentLayout' />

        {/* Cluster, User */}
        {isBusinessVersion && <TopBar />}

        {/* Page */}
        <Content style={{ display: 'flex', flexDirection: 'column', overflow: 'overlay', overflowX: 'hidden', background: '#f0f2f5', padding: '1em 2em', zIndex: 1 }}>
            <AppPageHeader />

            <ErrorDisplay>
                <div style={{ borderRadius: '3px', background: '#fff' }}>
                    <RouteView />
                </div>
            </ErrorDisplay>
        </Content>

    </Layout>
);

class App extends PureComponent {

    render() {
        this.loginHandling(); // Complete login, or fetch user if needed

        return (
            <ErrorBoundary>
                <Switch>
                    {/* Login (and callbacks) */}
                    <Route exact path='/login' component={Login} />
                    <Route exact path='/login/callbacks/google'><LoginCompletePage provider='google' /></Route>
                    <Route exact path='/login/callbacks/github'><LoginCompletePage provider='github' /></Route>

                    {/* Default View */}
                    <Route path="*">
                        <Layout style={{ height: '100vh', background: 'transparent', overflow: 'hidden' }}>
                            <AppSide />
                            <AppContent />
                        </Layout>
                    </Route>
                </Switch>
            </ErrorBoundary>
        );
    }

    loginHandling() {

        if (!isBusinessVersion) return;

        const isDev = !IsProduction;
        const devPrint = function (str: string) { if (isDev) console.log(str); }
        devPrint('loginHandling: path=' + window.location.pathname);


        if (window.location.pathname.startsWith('/login/callbacks/')) {
            devPrint('loginHandling: completing callback...');
        } else if (!api.UserData) {
            devPrint('loginHandling: user is null, fetching');

            fetchWithTimeout('/api/users/me', 10 * 1000).then(async r => {
                if (r.ok) {
                    api.UserData = await r.json() as UserData;
                    devPrint('loginHandling: fetched user successfully');
                } else if (r.status == 401) {
                    devPrint('loginHandling: status=401, meaning we are not logged in');
                }
            });
        } else {
            devPrint('loginHandling: user is set: ' + JSON.stringify(api.UserData));
        }
    }
}
export default App;