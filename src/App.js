const { useState, useEffect, useRef, Suspense } = React;
const { Canvas, useFrame, useLoader, useThree } = ReactThreeFiber;
const { OrbitControls, Text, Html, useProgress } = drei;
const { motion, useAnimation, useInView } = framerMotion;

// Keep your utility functions and custom hooks as they are
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, useProgress } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { motion, useAnimation, useInView } from 'framer-motion';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Utility functions
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Custom hooks
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = ev => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

// 3D Components
const CircuitBoard = () => {
  const mesh = useRef();
  const texture = useLoader(TextureLoader, '/circuit-texture.jpg');

  useFrame((state) => {
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    mesh.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -5]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
};

const FloatingChip = ({ position }) => {
  const mesh = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    mesh.current.rotation.z = Math.cos(state.clock.elapsedTime) * 0.2;
  });

  return (
    <mesh
      ref={mesh}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.5, 0.5, 0.1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      <Html distanceFactor={10}>
        <div className="bg-white p-2 rounded shadow-lg">
          <h3 className="text-sm font-bold">Microchip</h3>
          <p className="text-xs">ARM Cortex-M4</p>
        </div>
      </Html>
    </mesh>
  );
};

const ConnectingLines = () => {
  const lines = useRef();

  useFrame(() => {
    lines.current.children.forEach((line) => {
      line.material.uniforms.dashOffset.value -= 0.01;
    });
  });

  return (
    <group ref={lines}>
      <Line start={[-2, 0, 0]} end={[2, 0, 0]} />
      <Line start={[0, -2, 0]} end={[0, 2, 0]} />
      <Line start={[-1, -1, 0]} end={[1, 1, 0]} />
    </group>
  );
};

const Line = ({ start, end }) => {
  const ref = useRef();

  useEffect(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ]);
    ref.current.geometry = geometry;
  }, [start, end]);

  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineDashedMaterial color="cyan" dashSize={0.2} gapSize={0.1} />
    </line>
  );
};

// Main Components
const Loader = () => {
  const { progress } = useProgress();
  return <Html center>{progress} % loaded</Html>;
};

const Scene = () => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <OrbitControls enableZoom={false} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <Suspense fallback={<Loader />}>
        <CircuitBoard />
        <FloatingChip position={[-2, 0, 0]} />
        <FloatingChip position={[2, 0, 0]} />
        <FloatingChip position={[0, 2, 0]} />
        <ConnectingLines />
      </Suspense>
    </Canvas>
  );
};

const ParallaxBackground = () => {
  const { scrollY } = useThree();
  const group = useRef();

  useFrame(() => {
    group.current.position.y = (-scrollY.current / window.innerHeight) * 2;
  });

  return (
    <group ref={group}>
      {[...Array(200)].map((_, i) => (
        <mesh key={i} position={[Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 10 - 15]}>
          <sphereGeometry args={[0.05, 32, 32]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
};

const Header = () => {
  const mousePosition = useMousePosition();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <nav className="container mx-auto px-6 py-4">
        <ul className="flex justify-center space-x-8">
          {['About', 'Skills', 'Projects', 'Experience', 'Contact'].map((item) => (
            <motion.li
              key={item}
              className="relative"
              whileHover={{ scale: 1.1 }}
              style={{
                transform: `translate(${(mousePosition.x - window.innerWidth / 2) / 50}px, ${
                  (mousePosition.y - window.innerHeight / 2) / 50
                }px)`,
              }}
            >
              <a
                href={`#${item.toLowerCase()}`}
                className={`text-lg font-semibold ${
                  isScrolled ? 'text-gray-800' : 'text-white'
                } hover:text-blue-500 transition-colors`}
              >
                {item}
              </a>
            </motion.li>
          ))}
        </ul>
      </nav>
    </motion.header>
  );
};

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <div className="relative z-10 text-center">
        <motion.h1
          className="text-6xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          John Doe
        </motion.h1>
        <motion.p
          className="text-2xl text-gray-300 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          Embedded Systems Visionary
        </motion.p>
        <motion.a
          href="#contact"
          className="bg-blue-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Let's Connect
        </motion.a>
      </div>
    </section>
  );
};

const About = () => {
  const controls = useAnimation();
  const ref = useRef();
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <section id="about" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 50 }
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-8 text-center">About Me</h2>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <Canvas>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <Suspense fallback={null}>
                  <AnimatedAvatar />
                </Suspense>
                <OrbitControls enableZoom={false} />
              </Canvas>
            </div>
            <div className="md:w-1/2 md:pl-8">
              <p className="text-lg mb-4">
                As an embedded systems engineer with over a decade of experience, I've been at the forefront of developing intelligent solutions for the Internet of Things (IoT), automotive systems, and industrial automation.
              </p>
              <p className="text-lg mb-4">
                My expertise lies in optimizing hardware-software integration, implementing real-time operating systems, and pushing the boundaries of what's possible with constrained resources.
              </p>
              <p className="text-lg">
                When I'm not immersed in the world of microcontrollers and firmware, you'll find me mentoring aspiring engineers and contributing to open-source projects that advance the field of embedded systems.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const AnimatedAvatar = () => {
  const gltf = useLoader(GLTFLoader, '/avatar.glb');
  const mesh = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = Math.sin(t / 4) / 2;
    mesh.current.position.y = Math.sin(t / 1.5) / 2;
  });

  return <primitive object={gltf.scene} ref={mesh} scale={[2, 2, 2]} />;
};

const Skills = () => {
  const controls = useAnimation();
  const ref = useRef();
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const skills = [
    { name: 'Embedded C/C++', level: 95 },
    { name: 'RTOS', level: 90 },
    { name: 'IoT Protocols', level: 85 },
    { name: 'PCB Design', level: 80 },
    { name: 'ARM Architecture', level: 92 },
    { name: 'Low-Power Design', level: 88 },
  ];

  return (
    <section id="skills" className="py-20 bg-gray-800 text-white">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 50 }
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-12 text-center">Core Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {skills.map((skill, index) => (
              <SkillBar key={index} skill={skill.name} level={skill.level} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const SkillBar = ({ skill, level }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(level);
  }, [level]);

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium">{skill}</span>
        <span className="text-sm font-medium">{level}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <motion.div
          className="bg-blue-600 h-2.5 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

const Projects = () => {
  const controls = useAnimation();
  const ref = useRef();
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const projects = [
    {
      title: 'Smart Home Energy Monitor',
      description: 'Developed a low-power IoT device for real-time energy consumption monitoring and optimization.',
      image: '/smart-home-energy.jpg',
      technologies: ['ARM Cortex-M4', 'FreeRTOS', 'Bluetooth LE', 'C++'],
    },
    {
      title: 'Automotive ADAS System',
      description: 'Contributed to the firmware of an advanced driver-assistance system, focusing on sensor fusion and real-time processing.',
      image: '/adas-system.jpg',
      technologies: ['Infineon AURIX', 'AUTOSAR', 'C', 'CAN'],
    },
    {
      title: 'Industrial IoT Gateway',
      description: 'Designed and implemented a versatile IoT gateway for industrial automation, supporting multiple protocols and cloud connectivity.',
      image: '/iot-gateway.jpg',
      technologies: ['Linux', 'Python', 'MQTT', 'ModbusTCP'],
    },
  ];

  return (
    <section id="projects" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 50 }
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-12 text-center">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ProjectCard = ({ title, description, image, technologies }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
      whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <div className="relative h-48">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-white text-center px-4">{description}</p>
        </motion.div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="flex flex-wrap">
          {technologies.map((tech, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Experience = () => {
  const controls = useAnimation();
  const ref = useRef();
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const experiences = [
    {
      title: 'Senior Embedded Systems Engineer',
      company: 'TechCorp Industries',
      period: '2019 - Present',
      description: 'Leading the development of next-generation IoT devices and automotive systems.',
      achievements: [
        'Reduced power consumption of IoT devices by 40% through innovative sleep mode implementations',
        'Led a team of 5 engineers in developing a new ADAS system, completed 2 months ahead of schedule',
        'Implemented a novel sensor fusion algorithm, improving object detection accuracy by 25%',
      ],
    },
    {
      title: 'Embedded Software Developer',
      company: 'Innovative Solutions Inc.',
      period: '2015 - 2019',
      description: 'Focused on firmware development for industrial automation and control systems.',
      achievements: [
        'Developed a real-time operating system scheduler that improved system responsiveness by 30%',
        'Implemented a secure over-the-air (OTA) update system for remote firmware updates',
        'Optimized memory usage in constrained environments, reducing RAM usage by 25%',
      ],
    },
    {
      title: 'Junior Firmware Engineer',
      company: 'StartUp Innovations',
      period: '2012 - 2015',
      description: 'Contributed to the development of consumer electronics and wearable devices.',
      achievements: [
        'Implemented low-power Bluetooth LE stack for wearable fitness tracker',
        'Developed firmware for a smart home thermostat, integrating with major IoT platforms',
        'Contributed to the development of a custom RTOS for ultra-low-power microcontrollers',
      ],
    },
  ];

  return (
    <section id="experience" className="py-20 bg-gray-800 text-white">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 50 }
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-12 text-center">Professional Journey</h2>
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <ExperienceCard key={index} {...exp} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const ExperienceCard = ({ title, company, period, description, achievements, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="bg-gray-700 rounded-lg p-6 cursor-pointer"
      whileHover={{ scale: 1.02 }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <motion.div
        initial={false}
        animate={{ backgroundColor: isOpen ? "#4A5568" : "#2D3748" }}
        className="flex justify-between items-center"
      >
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-gray-400">{company}</p>
        </div>
        <p className="text-gray-400">{period}</p>
      </motion.div>
      <motion.div
        initial="collapsed"
        animate={isOpen ? "open" : "collapsed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          collapsed: { opacity: 0, height: 0 }
        }}
        transition={{ duration: 0.8, ease: [0.04, 0.62, 0.23, 0.98] }}
      >
        <p className="mt-4 text-gray-300">{description}</p>
        <ul className="mt-4 list-disc list-inside space-y-2">
          {achievements.map((achievement, idx) => (
            <li key={idx} className="text-gray-300">{achievement}</li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
};

const Contact = () => {
  const controls = useAnimation();
  const ref = useRef();
  const inView = useInView(ref);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the form submission, e.g., sending an email or saving to a database
    console.log('Form submitted:', formState);
    // Reset form after submission
    setFormState({ name: '', email: '', message: '' });
  };

  const handleChange = (e) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section id="contact" className="py-20 bg-gray-100">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 50 }
          }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold mb-12 text-center">Get in Touch</h2>
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="4"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
              <div>
                <motion.button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Send Message
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>&copy; 2024 John Doe. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
<path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const App = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <Contact />
      <Footer />
    </div>
  );
};

// Utility Components

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <motion.button
      className={`fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg ${isVisible ? 'block' : 'hidden'}`}
      onClick={scrollToTop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </motion.button>
  );
};

const AppWrapper = () => {
  return (
    <React.StrictMode>
      <App />
      <ScrollToTopButton />
    </React.StrictMode>
  );
};

ReactDOM.render(<AppWrapper />, document.getElementById('root'));
