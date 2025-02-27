"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import createBlockie from "ethereum-blockies-base64";
import { useAccount, useBalance, useChainId } from "wagmi";
import { Address, Balance } from "~~/components/scaffold-eth";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const chainId = useChainId();
  const [joinDate, setJoinDate] = useState<string>("");
  const [blockieUrl, setBlockieUrl] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  
  // 태스크 통계 상태 추가
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [inProgressTasks, setInProgressTasks] = useState<number>(0);
  const [totalEarnedPoints, setTotalEarnedPoints] = useState<string>("0");
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  // TaskToken 인터페이스가 아직 등록되지 않은 경우 임시 우회 방법 사용
  const { data: taskToken } = useScaffoldContract({
    contractName: "TaskToken" as any,
  });
  
  // TaskContract 가져오기
  const { data: taskContract } = useScaffoldContract({
    contractName: "TaskContract",
  });

  // 토큰 잔액 조회
  const fetchTokenBalance = async () => {
    if (taskToken && address) {
      try {
        const balance = await taskToken.read.balanceOf([address]);
        // balance가 bigint인지 확인 후 변환
        if (typeof balance === 'bigint') {
          setTokenBalance(formatEther(balance));
        } else {
          console.error("잘못된 잔액 형식:", balance);
          setTokenBalance("0");
        }
      } catch (error) {
        console.error("토큰 잔액 조회 오류:", error);
      }
    }
  };
  
  // 태스크 통계 데이터 가져오기
  const fetchTaskStatistics = async () => {
    if (!taskContract || !address) return;
    
    try {
      setIsLoadingStats(true);
      
      // 사용자의 태스크 목록 가져오기
      const userTasks = await taskContract.read.getUserTasks([address]);
      
      // 완료된 태스크와 진행 중인 태스크 분류
      let completed = 0;
      let inProgress = 0;
      
      // 데이터 구조에 따라 처리
      if (Array.isArray(userTasks)) {
        userTasks.forEach(task => {
          // 태스크 상태에 따라 분류
          if (task.status === "Completed") {
            completed++;
          } else if (task.status === "In Progress") {
            inProgress++;
          }
        });
      }
      
      setCompletedTasks(completed);
      setInProgressTasks(inProgress);
      
      // 총 획득 포인트 계산 (완료된 태스크 * 보상 금액)
      if (taskToken) {
        try {
          // const rewardAmount = await taskToken.read.rewardAmount();
          // const rewardAmount = BigInt(10);
          // const totalPoints = rewardAmount * BigInt(completed);
          setTotalEarnedPoints((10 * completed).toString());
        } catch (error) {
          console.error("보상 금액 조회 오류:", error);
        }
      }
      
    } catch (error) {
      console.error("태스크 통계 조회 오류:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    // 가입일 데이터를 로컬 스토리지에서 가져오기
    if (address && typeof window !== "undefined") {
      const storedDate = localStorage.getItem(`joinDate_${address}`);
      if (storedDate) {
        setJoinDate(storedDate);
      } else {
        const newDate = new Date().toLocaleDateString("ko-KR");
        localStorage.setItem(`joinDate_${address}`, newDate);
        setJoinDate(newDate);
      }
      
      // 블록키 생성
      try {
        const blockie = createBlockie(address);
        setBlockieUrl(blockie);
      } catch (error) {
        console.error("블록키 생성 오류:", error);
      }
      
      // 토큰 잔액 조회
      fetchTokenBalance();
      
      // 태스크 통계 조회
      fetchTaskStatistics();
    }
  }, [address, taskToken, taskContract]);

  const getChainName = (chainId: number | undefined) => {
    if (!chainId) return "연결 중...";
    
    switch (chainId) {
      case 31337:
        return "로컬호스트";
      case 1:
        return "Ethereum";
      case 42161:
        return "Arbitrum";
      case 421614:
        return "Arbitrum Sepolia";
      case 11155111:
        return "Sepolia";
      case 137:
        return "Polygon";
      case 10:
        return "Optimism";
      case 8453:
        return "Base";
      case 84532:
        return "Base Sepolia";
      case 420:
        return "Optimism Sepolia";
      default:
        return `Chain ${chainId}`;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-8">프로필</h1>
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg max-w-md mx-auto">
            <p className="text-xl mb-4">지갑을 연결해 주세요</p>
            <p className="text-gray-400">프로필 정보를 보려면 지갑 연결이 필요합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen py-8 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">My Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden mb-4 relative">
                {blockieUrl ? (
                  <Image 
                    src={blockieUrl} 
                    alt="지갑 아바타" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-gray-400">
                    로딩 중...
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold mb-2">내 지갑</h2>
              <Address address={address} format="long" />
              
              {/* 토큰 잔액 표시 */}
              <div className="mt-4 bg-blue-900 p-3 rounded-lg w-full text-center">
                <h3 className="text-lg font-semibold mb-1">보유 포인트</h3>
                <p className="text-2xl font-bold">{parseFloat(tokenBalance).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} POINT</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">지갑 정보</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">네트워크</span>
                    <span className="font-medium">{getChainName(chainId)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-400">가입일</span>
                    <span className="font-medium">{joinDate || "정보 없음"}</span>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">ETH 잔액</span>
                    <div>
                      <Balance address={address} className="font-medium" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 태스크 통계 섹션 추가 */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mt-6">
              <h2 className="text-xl font-bold mb-4">활동 요약</h2>
              
              {isLoadingStats ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-gray-700 rounded"></div>
                  <div className="h-12 bg-gray-700 rounded"></div>
                  <div className="h-12 bg-gray-700 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-400">완료한 태스크</span>
                      <span className="font-medium text-green-400">{completedTasks}개</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-400">진행 중인 태스크</span>
                      <span className="font-medium text-yellow-400">{inProgressTasks}개</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-400">획득한 총 포인트</span>
                      <span className="font-medium text-blue-400">{parseFloat(totalEarnedPoints).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} POINT</span>
                    </div>
                  </div>
                  
                  {/* 완료율 바 차트 - 간단한 구현 */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">태스크 완료율</h3>
                    <div className="w-full bg-gray-600 rounded-full h-4 mb-1">
                      {completedTasks + inProgressTasks > 0 ? (
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ 
                            width: `${(completedTasks / (completedTasks + inProgressTasks)) * 100}%` 
                          }}
                        ></div>
                      ) : (
                        <div className="h-4"></div>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>0%</span>
                      <span>
                        {completedTasks + inProgressTasks > 0 
                          ? `${((completedTasks / (completedTasks + inProgressTasks)) * 100).toFixed(1)}%` 
                          : '0%'}
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;