import React from 'react'
import Navbar from '../Components/Navbar'
import Main from '../Components/Main'
const Dashboard = () => {
  return (
    <div className='mx-auto bg-[#f8fafc] '>
      <Navbar/>
      <div className='p-4 md:p-6'>
      <Main/>
      </div>
    </div>
  )
}

export default Dashboard
