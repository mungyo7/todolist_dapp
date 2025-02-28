# Todo List Dapp

블록체인 기반의 Todo List 관리 애플리케이션입니다.

## 주요 기능

- Task 생성, 조회, 수정, 삭제
- Task 완료 시 토큰(포인트) 보상
- AI 챗봇 도우미
- 사용자 프로필 및 통계

## 기술 스택

- Frontend: Next.js, TypeScript, TailwindCSS
- Smart Contract: Solidity
- Blockchain: Arbitrum, Sepolia
- AI: Claude 3.5 Haiku

## 스마트 컨트랙트

### TaskContract
- Task 생성, 조회, 수정, 삭제 기능
- 사용자별 Task 관리
- 이벤트 발생 및 상태 추적

### TaskToken (ERC20)
- 태스크 완료 보상 토큰
- 태스크 완료당 10 TTK 보상

## .env 파일 설정하기

```
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```