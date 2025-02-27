"use client";

// @refresh reset
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";
import { TokenBalance } from "../TokenBalance";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const { targetNetwork } = useTargetNetwork();
  const networkColor = useNetworkColor();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    지갑 연결
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <div className="flex items-center gap-2 mr-1">
                    <div className="bg-base-200 px-3 py-1.5 rounded-lg shadow-md min-w-[120px] text-center flex justify-center items-center">
                      <TokenBalance 
                        address={account.address as Address} 
                        className="text-base font-semibold text-white" 
                      />
                    </div>
                    <div className="bg-base-200 px-3 py-0.5 rounded-lg shadow-md min-w-[120px] text-center flex justify-center items-center">
                      <Balance 
                        address={account.address as Address} 
                        className="text-base font-semibold text-white" 
                      />
                    </div>
                    <div 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ 
                        background: `linear-gradient(90deg, ${networkColor}22, ${networkColor}44)`,
                        border: `1px solid ${networkColor}66`
                      }}
                    >
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: networkColor }}></span>
                      <span className="text-sm font-medium" style={{ color: networkColor }}>
                        {chain.name}
                      </span>
                    </div>
                  </div>
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                  <AddressQRCodeModal 
                    address={account.address as Address} 
                    modalId="qrcode-modal" 
                  />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
