"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { useAccount, useWalletClient } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

// 태스크 타입 정의
interface Task {
  id: number;
  name: string;
  dueDate: string;
  status: string;
}

const Home = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMinute, setSelectedMinute] = useState("00");

  // 읽기 전용 컨트랙트 인스턴스
  const { data: taskContract } = useScaffoldContract({
    contractName: "TaskContract",
  });

  // 쓰기 가능한 컨트랙트 인스턴스
  const { data: taskContractWrite } = useScaffoldContract({
    contractName: "TaskContract",
    walletClient,
  });

  // 모든 태스크 가져오기
  const fetchTasks = async () => {
    if (!taskContract || !connectedAddress) return;
    
    try {
      // getAllTasks() 대신 getUserTasks() 함수 사용
      const tasks = await taskContract.read.getUserTasks([connectedAddress]);
      
      const formattedTasks = tasks.map((task: any) => {
        // 타임스탬프를 한국 날짜 형식으로 변환
        const dueDate = new Date(Number(task.dueDate) * 1000);
        const formattedDate = format(dueDate, "yyyy. M. dd. 오후 h:mm:ss");
        
        return {
          id: Number(task.id),
          name: task.name,
          dueDate: formattedDate,
          status: task.status
        };
      });
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error("태스크 조회 오류:", error);
    }
  };

  // 컨트랙트나 연결된 지갑이 변경될 때마다 태스크 목록 갱신
  useEffect(() => {
    if (taskContract && connectedAddress) {
      fetchTasks();
    } else {
      // 지갑 연결이 해제되면 태스크 목록 비우기
      setTasks([]);
    }
  }, [taskContract, connectedAddress]);

  // 날짜와 분을 조합하여 newTaskDate 설정
  useEffect(() => {
    if (selectedDate) {
      // 날짜와 시간에서 분 부분을 제외한 부분 추출 (YYYY-MM-DDThh)
      const dateWithoutMinutes = selectedDate.split(':')[0];
      // 선택된 분을 조합
      const fullDateTime = `${dateWithoutMinutes}:${selectedMinute}`;
      setNewTaskDate(fullDateTime);
    }
  }, [selectedDate, selectedMinute]);

  const filteredTasks = tasks
    .filter(task => {
      // Deleted 상태 제외
      if (task.status === "Deleted") return false;
      
      // 탭별 필터링
      if (activeTab === "In Progress" && task.status !== "In Progress") return false;
      if (activeTab === "Finished" && task.status !== "Completed") return false;
      
      // 검색어 필터링
      if (searchTerm && !task.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    })
    .sort((a, b) => {
      // 한국어 날짜 문자열을 파싱하기 위한 함수
      const parseKoreanDate = (dateStr: string) => {
        try {
          if (!dateStr) return new Date(0); // 날짜가 없는 경우 기본값 반환
          
          const parts = dateStr.split('오');
          if (parts.length < 2) return new Date(0);
          
          const datePart = parts[0].trim();
          const timePart = '오' + parts[1];
          
          const [year, month, day] = datePart.split('.').map(num => num.trim()).filter(Boolean);
          const period = timePart.includes('오후') ? '오후' : '오전';
          const timeStr = timePart.replace(period, '').trim();
          const [hour, minute] = timeStr.split(':').map(num => parseInt(num.trim()));
          
          let adjustedHour = hour;
          // 오후인 경우 12를 더함 (24시간 형식으로 변환)
          if (period === '오후' && hour !== 12) {
            adjustedHour += 12;
          }
          // 오전 12시는 0시로 변환
          if (period === '오전' && hour === 12) {
            adjustedHour = 0;
          }
          
          return new Date(
            parseInt(year),
            parseInt(month) - 1, // 월은 0부터 시작
            parseInt(day),
            adjustedHour,
            minute || 0
          );
        } catch (error) {
          console.error('날짜 파싱 오류:', error, dateStr);
          return new Date(0); // 파싱 실패시 기본값 반환
        }
      };
      
      const dateA = parseKoreanDate(a.dueDate);
      const dateB = parseKoreanDate(b.dueDate);
      
      return dateA.getTime() - dateB.getTime();
    });
  
  const handleAddTask = async () => {
    if (!newTaskName || !isConnected || !taskContractWrite) return;
    
    try {
      // 날짜 계산
      let dueTimestamp;
      if (newTaskDate) {
        const date = parseISO(newTaskDate);
        dueTimestamp = Math.floor(date.getTime() / 1000);
      } else {
        dueTimestamp = Math.floor(Date.now() / 1000) + 86400; // 기본값: 하루 뒤
      }
      
      // 컨트랙트 호출
      await taskContractWrite.write.createTask([newTaskName, BigInt(dueTimestamp)]);
      
      setNewTaskName("");
      setNewTaskDate("");
      
      // 태스크 목록 갱신
      setTimeout(fetchTasks, 2000); // 트랜잭션이 마이닝될 시간을 고려해 약간의 지연 추가
    } catch (error) {
      console.error("태스크 추가 오류:", error);
    }
  };
  
  const handleToggleStatus = async (id: number) => {
    if (!isConnected || !taskContractWrite) return;
    
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const newStatus = task.status === "Completed" ? "In Progress" : "Completed";
      
      // 상태 변경이 "Completed"로 변경되는 경우에만 알림 표시
      if (newStatus === "Completed") {
        notification.info("태스크 완료 처리 중...", { duration: 2000 });
      }
      
      await taskContractWrite.write.changeTaskStatus([BigInt(id), newStatus]);
      
      // 완료 상태로 변경된 경우 보상 알림 표시
      if (newStatus === "Completed") {
        notification.success("태스크를 완료하여 10 POINT를 받았습니다!", {
          duration: 5000
        });
      }
      
      // 태스크 목록 갱신
      setTimeout(fetchTasks, 2000);
    } catch (error) {
      console.error("상태 변경 오류:", error);
      notification.error("상태 변경 중 오류가 발생했습니다");
    }
  };
  
  // 태스크 삭제 함수 추가
  const handleDeleteTask = async (id: number) => {
    if (!isConnected || !taskContractWrite) return;
    
    try {
      // 삭제 함수 호출
      await taskContractWrite.write.deleteTask([BigInt(id)]);
      
      // UI에서 즉시 제거 (낙관적 UI 업데이트)
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      
      // 2초 후 데이터 다시 가져오기
      setTimeout(fetchTasks, 2000);
    } catch (error) {
      console.error("태스크 삭제 오류:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen py-8 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Todo List</h1>
        
        <div className="flex justify-between mb-6">
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeTab === "All" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              모든 태스크
            </button>
            <button 
              className={`tab ${activeTab === "In Progress" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("In Progress")}
            >
              진행 중
            </button>
            <button 
              className={`tab ${activeTab === "Finished" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("Finished")}
            >
              완료됨
            </button>
          </div>
          
          <div>
            <input
              type="text"
              placeholder="태스크 검색..."
              className="p-2 bg-gray-700 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">Task List</h2>
              
              {filteredTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400">태스크가 없습니다</div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-lg font-medium ${task.status === "Completed" ? "line-through text-gray-400" : ""}`}>
                            {task.name}
                          </h3>
                          <p className="text-sm text-gray-400">마감일: {task.dueDate}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`badge ${task.status === "Completed" ? "badge-success" : "badge-warning"}`}>
                            {task.status === "Completed" ? "완료" : "진행 중"}
                          </span>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleToggleStatus(task.id)}
                          >
                            {task.status === "Completed" ? "미완료로 표시" : "완료로 표시"}
                          </button>
                          <button 
                            className="btn btn-sm btn-error"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Task</h2>
            <div className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  placeholder="태스크 이름..."
                  className="w-full p-2 bg-gray-700 rounded-md text-white"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1">Due Date</label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    className="flex-1 p-2 bg-gray-700 rounded-md text-white"
                    value={selectedDate}
                    onChange={(e) => {
                      // 분을 제외한 날짜와 시간 저장
                      const value = e.target.value;
                      // datetime-local의 값이 있으면 처리
                      if (value) {
                        // 값에서 분을 00으로 설정
                        const dateWithZeroMinutes = value.split(':')[0] + ':00';
                        setSelectedDate(dateWithZeroMinutes);
                      } else {
                        setSelectedDate("");
                      }
                    }}
                    step="3600" // 시간 단위로만 선택 가능
                  />
                  <select
                    className="p-2 bg-gray-700 rounded-md text-white"
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                  >
                    <option value="00">00분</option>
                    <option value="15">15분</option>
                    <option value="30">30분</option>
                    <option value="45">45분</option>
                  </select>
                </div>
              </div>
              <button
                className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                onClick={handleAddTask}
                disabled={!isConnected || !newTaskName}
              >
                {isConnected ? "ADD" : "지갑 연결 필요"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

