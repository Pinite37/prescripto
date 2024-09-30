import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
      <div className='text-center text-2xl'>
        <p>ABOUT <span>US</span></p>
      </div>

      <div>
        <img src={assets.about_image} alt="" />
        <div>
          <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quasi excepturi cumque alias numquam est delectus sint? Vero error, earum dolores perferendis nam fugit velit accusantium veniam repudiandae laboriosam, ipsum aliquid.</p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex ipsam voluptate rem deleniti est eveniet magnam adipisci odit voluptatibus sunt minus explicabo libero molestias quidem, similique ut commodi quis quisquam maiores ab recusandae totam voluptas provident? Repudiandae, est nobis perferendis facere vero suscipit aperiam maxime ullam ratione fuga dolorum veniam!</p>
          <b>Our Vision</b>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni reprehenderit, quod accusamus eaque magnam itaque?</p>
        </div>
      </div>
    </div>
  )
}

export default About