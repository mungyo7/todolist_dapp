"use client";

import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

type TokenBalanceProps = {
  address?: Address;
  className?: string;
};

/**
 * 사용자의 TaskToken 잔액을 표시하는 컴포넌트
 */
export const TokenBalance = ({ address, className = "" }: TokenBalanceProps) => {
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const { address: connectedAddress } = useAccount();

  // 읽기 전용 컨트랙트 인스턴스
  // TaskToken을 TaskContract 또는 실제 등록된 컨트랙트 이름으로 변경
  const { data: taskTokenContract } = useScaffoldContract({
    contractName: "TaskContract", // 또는 scaffold-eth에 등록된 올바른 컨트랙트 이름
  });

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!taskTokenContract || !address) return;
      
      try {
        setIsLoading(true);
        // 컨트랙트의 실제 메서드 이름을 사용
        // ERC20 표준 balanceOf가 없는 경우 대체 메서드 사용
        const tokenBalance = await taskTokenContract.read.getTokenBalance([address]);
        // 18 소수점 자리를 고려하여 변환 (ERC20 표준)
        const formattedBalance = Number(tokenBalance) / Math.pow(10, 18);
        setBalance(formattedBalance.toString());
      } catch (error) {
        console.error("토큰 잔액 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenBalance();
    
    // 30초마다 잔액 갱신
    const intervalId = setInterval(fetchTokenBalance, 30000);
    
    return () => clearInterval(intervalId);
  }, [taskTokenContract, address, connectedAddress]);

  if (isLoading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="font-bold">{parseFloat(balance).toFixed(2)} POINT</span>
    </div>
  );
};