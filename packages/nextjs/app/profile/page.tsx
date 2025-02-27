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

  // TaskToken 인터페이스가 아직 등록되지 않은 경우 임시 우회 방법 사용
  const { data: taskToken } = useScaffoldContract({
    contractName: "TaskToken" as any,
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
    }
  }, [address, taskToken]);

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
        <h1 className="text-3xl font-bold mb-8 text-center">내 프로필</h1>
        
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
                <h3 className="text-lg font-semibold mb-1">보유 TaskToken</h3>
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
                    <span className="font-medium">{chainId ? (chainId === 31337 ? "로컬호스트" : chainId) : "연결 중..."}</span>
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
            
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg mt-6">
              <h2 className="text-xl font-bold mb-4">활동 요약</h2>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-400">완료한 태스크</span>
                  <span className="font-medium">계산 중...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 