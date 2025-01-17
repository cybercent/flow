import "../prism.less";
import DocsetSwitcher from "./docset-switcher";
import Header from "./header";
import HeaderNav from "./header-nav";
import PropTypes from "prop-types";
import React, { createContext, useMemo, useRef, useState } from "react";
import Search from "./search";
import styled from "@emotion/styled";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { Button } from "../ui/Button";
import { theme } from "../colors";
import breakpoints from "../utils/breakpoints";
import FlexWrapper from "./flex-wrapper";
import Layout from "./layout";
import MenuButton from "./menu-button";
import Sidebar from "./sidebar";
import SidebarNav from "./sidebar-nav";
import { useResponsiveSidebar } from "./responsive-sidebar";
import { Helmet } from "react-helmet";
import { IconMenuSelector } from "../ui/icons";
import { graphql, useStaticQuery } from "gatsby";
import MobileLogo from "./mobile-logo";
import { SelectedLanguageContext } from "./multi-code-block";
import { size } from "polished";
import { trackCustomEvent } from "gatsby-plugin-google-analytics";

const Main = styled.main({
  flexGrow: 1,
});

const ButtonWrapper = styled.div({
  flexGrow: 1,
});

const StyledButton = styled(Button)({
  width: "100%",
  ":not(:hover)": {
    backgroundColor: theme.background,
  },
});

const StyledIcon = styled(IconMenuSelector)(size(16), {
  marginLeft: "auto",
});

const MobileNav = styled.div({
  display: "none",
  [breakpoints.md]: {
    display: "flex",
    alignItems: "center",
    color: theme.text1,
  },
});

const HeaderInner = styled.span({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 32,
});

const GA_EVENT_CATEGORY_SIDEBAR = "Sidebar";

function handleToggleAll(expanded) {
  trackCustomEvent({
    category: GA_EVENT_CATEGORY_SIDEBAR,
    action: "Toggle all",
    label: expanded ? "expand" : "collapse",
  });
}

function handleToggleCategory(label, expanded) {
  trackCustomEvent({
    category: GA_EVENT_CATEGORY_SIDEBAR,
    action: "Toggle category",
    label,
    value: Number(expanded),
  });
}

export const NavItemsContext = createContext();

export default function PageLayout(props) {
  const data = useStaticQuery(
    graphql`
      {
        site {
          siteMetadata {
            title
            siteName
          }
        }
      }
    `
  );

  const {
    sidebarRef,
    openSidebar,
    sidebarOpen,
    handleWrapperClick,
    handleSidebarNavLinkClick,
  } = useResponsiveSidebar();

  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedLanguageState = useLocalStorage("docs-lang");

  function openMenu() {
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const { pathname } = props.location;
  const { siteName, title } = data.site.siteMetadata;
  const { subtitle, sidebar } = props.pageContext;
  const {
    discordUrl,
    twitterUrl,
    navConfig = {},
    pathConfig,
    footerNavConfig,
    logoLink,
    algoliaApiKey,
    algoliaIndexName,
    menuTitle,
  } = props.pluginOptions;

  const navItems = useMemo(
    () =>
      Object.entries(navConfig).map(([title, navItem]) => ({
        ...navItem,
        title,
      })),
    [navConfig]
  );

  const hideDocsetDropdown =
    navItems.length > 0 && pathConfig.hideDocsetDropdown.includes(pathname);

  const sidebarTitle = (
    <span className="title-sidebar">{subtitle || siteName}</span>
  );

  return (
    <Layout>
      <Helmet
        titleTemplate={["%s", subtitle, title].filter(Boolean).join(" - ")}
      >
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Helmet>
      <FlexWrapper onClick={handleWrapperClick}>
        <Sidebar
          responsive
          className="sidebar"
          open={sidebarOpen}
          ref={sidebarRef}
          title={siteName}
          logoLink={logoLink}
        >
          {!hideDocsetDropdown && (
            <HeaderInner>
              <ButtonWrapper ref={buttonRef}>
                <StyledButton
                  feel="flat"
                  color={theme.primary}
                  size="small"
                  onClick={openMenu}
                  style={{ display: "flex" }}
                >
                  {sidebarTitle}
                  <StyledIcon />
                </StyledButton>
              </ButtonWrapper>
            </HeaderInner>
          )}
          {sidebar && (
            <NavItemsContext.Provider value={navItems}>
              <SidebarNav
                contents={sidebar.contents}
                pathname={pathname}
                onToggleAll={handleToggleAll}
                onToggleCategory={handleToggleCategory}
                onLinkClick={handleSidebarNavLinkClick}
                pathConfig={pathConfig}
                alwaysExpanded={sidebar.alwaysExpanded}
              />
            </NavItemsContext.Provider>
          )}
        </Sidebar>
        <Main>
          <Header>
            <MobileNav>
              <MobileLogo />
              <MenuButton onClick={openSidebar} />
            </MobileNav>
            {algoliaApiKey && algoliaIndexName && (
              <Search
                siteName={siteName}
                apiKey={algoliaApiKey}
                indexName={algoliaIndexName}
              />
            )}
            <HeaderNav />
          </Header>
          <SelectedLanguageContext.Provider value={selectedLanguageState}>
            <NavItemsContext.Provider value={navItems}>
              {props.children}
            </NavItemsContext.Provider>
          </SelectedLanguageContext.Provider>
        </Main>
      </FlexWrapper>
      {!hideDocsetDropdown && (
        <DocsetSwitcher
          siteName={menuTitle || siteName}
          discordUrl={discordUrl}
          twitterUrl={twitterUrl}
          navItems={navItems}
          footerNavConfig={footerNavConfig}
          open={menuOpen}
          buttonRef={buttonRef}
          onClose={closeMenu}
        />
      )}
    </Layout>
  );
}

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object.isRequired,
  pageContext: PropTypes.object.isRequired,
  pluginOptions: PropTypes.object.isRequired,
};
