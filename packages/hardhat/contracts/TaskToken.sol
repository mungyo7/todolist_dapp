//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title 태스크 토큰 컨트랙트
 * @notice 태스크 완료 시 보상으로 지급되는 ERC20 토큰
 */
contract TaskToken is ERC20, Ownable {
    // 토큰 보상량 (기본값: 10 토큰)
    uint256 public rewardAmount = 10 * 10**18;
    
    // TaskContract 주소 (권한 부여용)
    address public taskContract;
    
    /**
     * @notice 컨트랙트 생성자
     * @param initialOwner 초기 소유자 주소
     */
    constructor(address initialOwner) 
        ERC20("TaskToken", "TTK") 
        Ownable(initialOwner) 
    {
        // 초기 공급량: 1,000,000 토큰
        _mint(initialOwner, 1_000_000 * 10**18);
    }
    
    /**
     * @notice TaskContract 주소 설정 (보상 지급 권한 부여)
     * @param _taskContract TaskContract 주소
     */
    function setTaskContract(address _taskContract) external onlyOwner {
        taskContract = _taskContract;
    }
    
    /**
     * @notice 보상 금액 설정
     * @param _amount 새 보상 금액 (wei 단위)
     */
    function setRewardAmount(uint256 _amount) external onlyOwner {
        rewardAmount = _amount;
    }
    
    /**
     * @notice 태스크 완료 보상 지급 (TaskContract만 호출 가능)
     * @param _to 보상 받을 주소
     */
    function rewardUser(address _to) external {
        require(msg.sender == taskContract, unicode"태스크 컨트랙트만 호출 가능합니다");
        _mint(_to, rewardAmount);
    }
}