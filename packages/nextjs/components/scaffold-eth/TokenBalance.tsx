"use client";

import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";

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
  const { data: taskToken } = useScaffoldContract({
    contractName: "TaskToken" as any,
  });

  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!taskToken || !address) return;
      
      try {
        setIsLoading(true);
        const balance = await taskToken.read.balanceOf([address]);
        // balance가 bigint인지 확인 후 변환
        if (typeof balance === 'bigint') {
          setBalance(formatEther(balance));
        } else {
          console.error("잘못된 잔액 형식:", balance);
          setBalance("0");
        }
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
  }, [taskToken, address, connectedAddress]);

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