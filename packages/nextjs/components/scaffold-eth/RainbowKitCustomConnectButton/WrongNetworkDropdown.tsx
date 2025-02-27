import { NetworkOptions } from "./NetworkOptions";
import { useDisconnect } from "wagmi";
import { ArrowLeftOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();
  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="dropdown dropdown-end mr-2">
      <label tabIndex={0} className="btn btn-error btn-sm dropdown-toggle gap-1">
        <span>다른 네트워크로 연결</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
      >
        <NetworkOptions />
        <li>
          <button
            className="menu-item text-error btn-sm !rounded-xl flex gap-3 py-3"
            type="button"
            onClick={() => disconnect()}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>연결 해제</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
