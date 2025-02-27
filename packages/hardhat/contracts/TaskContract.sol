//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "./TaskToken.sol";

/**
 * @title 태스크 관리 컨트랙트
 * @notice 사용자가 태스크를 생성, 조회, 상태 변경할 수 있는 컨트랙트
 */
contract TaskContract {
    // 태스크 구조체 정의
    struct Task {
        uint256 id;
        string name;
        uint256 dueDate;
        string status; // "In Progress" 또는 "Completed"
        address owner;
        bool isDeleted;
        bool isRewarded; // 보상 지급 여부 추가
    }

    // 상태 변수
    uint256 public taskCount = 0;
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;
    
    // 토큰 컨트랙트 참조
    TaskToken public taskToken;

    // 이벤트 정의
    event TaskCreated(uint256 id, string name, uint256 dueDate, string status, address owner);
    event TaskStatusChanged(uint256 id, string newStatus);
    event TaskDeleted(uint256 id, address owner);
    event RewardPaid(uint256 id, address user, uint256 amount); // 보상 지급 이벤트 추가

    /**
     * @notice 생성자 함수
     * @param _tokenAddress 토큰 컨트랙트 주소
     */
    constructor(address _tokenAddress) {
        taskToken = TaskToken(_tokenAddress);
    }

    /**
     * @notice 새로운 태스크 생성 함수
     * @param _name 태스크 이름
     * @param _dueDate 태스크 마감일 (타임스탬프)
     */
    function createTask(string memory _name, uint256 _dueDate) public {
        taskCount++;
        tasks[taskCount] = Task(
            taskCount,
            _name,
            _dueDate,
            "In Progress",
            msg.sender,
            false,
            false // 보상 지급 여부 초기값
        );
        
        userTasks[msg.sender].push(taskCount);
        
        emit TaskCreated(taskCount, _name, _dueDate, "In Progress", msg.sender);
    }

    /**
     * @notice 태스크 상태 변경 함수
     * @param _id 변경할 태스크 ID
     * @param _status 새로운 상태 ("In Progress" 또는 "Completed")
     */
    function changeTaskStatus(uint256 _id, string memory _status) public {
        require(_id > 0 && _id <= taskCount, unicode"태스크가 존재하지 않습니다");
        require(tasks[_id].owner == msg.sender, unicode"태스크 소유자가 아닙니다");
        require(!tasks[_id].isDeleted, unicode"삭제된 태스크입니다");
        
        tasks[_id].status = _status;
        
        // "Completed" 상태로 변경하고 아직 보상을 받지 않았다면 토큰 보상 지급
        if (keccak256(bytes(_status)) == keccak256(bytes("Completed")) && !tasks[_id].isRewarded) {
            tasks[_id].isRewarded = true;
            
            // 토큰 보상 지급
            uint256 rewardAmount = taskToken.rewardAmount();
            taskToken.rewardUser(msg.sender);
            
            emit RewardPaid(_id, msg.sender, rewardAmount);
        }
        
        emit TaskStatusChanged(_id, _status);
    }

    /**
     * @notice 태스크 삭제 함수
     * @param _id 삭제할 태스크 ID
     */
    function deleteTask(uint256 _id) public {
        require(_id > 0 && _id <= taskCount, unicode"태스크가 존재하지 않습니다");
        require(tasks[_id].owner == msg.sender, unicode"태스크 소유자가 아닙니다");
        require(!tasks[_id].isDeleted, unicode"이미 삭제된 태스크입니다");
        
        // 태스크를 삭제 상태로 표시
        tasks[_id].isDeleted = true;
        
        emit TaskDeleted(_id, msg.sender);
    }

    /**
     * @notice 모든 태스크 조회 함수
     * @return 전체 태스크 배열
     */
    function getAllTasks() public view returns (Task[] memory) {
        uint256 activeTasks = 0;
        
        // 활성 태스크 수 계산
        for (uint256 i = 1; i <= taskCount; i++) {
            if (!tasks[i].isDeleted) {
                activeTasks++;
            }
        }
        
        Task[] memory allTasks = new Task[](activeTasks);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= taskCount; i++) {
            if (!tasks[i].isDeleted) {
                allTasks[index] = tasks[i];
                index++;
            }
        }
        
        return allTasks;
    }

    /**
     * @notice 사용자의 태스크 조회 함수
     * @param _user 사용자 주소
     * @return 사용자의 태스크 배열
     */
    function getUserTasks(address _user) public view returns (Task[] memory) {
        uint256[] memory userTaskIds = userTasks[_user];
        uint256 activeTasks = 0;
        
        // 삭제되지 않은 태스크 수 계산
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            if (!tasks[userTaskIds[i]].isDeleted) {
                activeTasks++;
            }
        }
        
        Task[] memory result = new Task[](activeTasks);
        uint256 index = 0;
        
        for (uint256 i = 0; i < userTaskIds.length; i++) {
            if (!tasks[userTaskIds[i]].isDeleted) {
                result[index] = tasks[userTaskIds[i]];
                index++;
            }
        }
        
        return result;
    }

    // 토큰 잔액 조회 함수 추가
    function getTokenBalance(address account) public view returns (uint256) {
        return taskToken.balanceOf(account);
    }
}