import { Routes, Route, Navigate} from 'react-router';
import Homepage from './pages/homepage';
import Login from './pages/login';
import Signup from './pages/signup';
import {checkAuth} from '../src/authSlice';
import { useDispatch,useSelector } from 'react-redux';
import { useEffect } from 'react';
import AdminPanel from './pages/adminpanel';
import Problems from './pages/problems';
import CreateForm from './pages/createform';
import DeleteProblem from './pages/deleteproblem';
import UpdateList from './pages/updatelist';
import UpdateForm from './pages/updateform';
import AdminVideo from './pages/adminvideo';
import VideoUpload from './pages/videoupload';


function App(){

  const{isAuthenticated,loading,user} =useSelector((state)=>{
    return state.auth;
  });
  const dispatch=useDispatch();

  useEffect(()=>{
    dispatch(checkAuth())
    
  },[dispatch]);

    console.log({
    isAuthenticated,
    loading,
    user,
  });


  

  if(loading){
    return <div className='min-h-screen flex items-center justify-center'>
      <span className='loading loading-spinner loading-lg'></span>

    </div>
  }

  

  
return (

  <>
  <Routes>
    <Route path="/" element={isAuthenticated? <Homepage/> : <Navigate to='/signup'></Navigate> } />
    <Route path="/login" element={isAuthenticated? <Navigate to='/'></Navigate> : <Login/>  } />
    <Route path="/signup" element={isAuthenticated? <Navigate to='/'></Navigate> : <Signup/>} />
    <Route
  path="/admin"
  element={isAuthenticated && user?.role==='admin' ? <AdminPanel/> : <Navigate to='/' />}
/>

   <Route
  path="/admin/create"
  element={isAuthenticated && user?.role==='admin' ? <CreateForm/> : <Navigate to='/' />}
/>

   <Route
  path="/admin/delete"
  element={isAuthenticated && user?.role==='admin' ? <DeleteProblem/> : <Navigate to='/' />}
/>

  <Route
  path="/admin/update"
  element={isAuthenticated && user?.role==='admin' ? <UpdateList/> : <Navigate to='/' />}
/>


  <Route
  path="/admin/update/:id"
  element={isAuthenticated && user?.role==='admin' ? <UpdateForm/> : <Navigate to='/' />}
/>

<Route path='problem/:problemId' element={<Problems/>} />



 <Route
  path="/admin/video"
  element={isAuthenticated && user?.role==='admin' ? <AdminVideo/> : <Navigate to='/' />}
/>

<Route
  path="/admin/videoupload/:problemId"
  element={isAuthenticated && user?.role==='admin' ? <VideoUpload/> : <Navigate to='/' />}
/>


  </Routes>
  </>

)

}


export default App;
