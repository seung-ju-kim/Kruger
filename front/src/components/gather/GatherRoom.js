import React, { useState } from 'react';
import Gathers from './Gathers';
import '../../styles/scss/gatherRoom.scss';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const GatherRoom = ({ handleOnClickPost }) => {
    const navigate = useNavigate();
    const handleOnClickNewPosting = () => {
        navigate('/posting');
    };

    return (
        <Container fluid style={{ width: '85%' }} className="gatherRoom">
            <Row className="text-end">
                <Col>
                    <button
                        className="newPostingBtn"
                        onClick={handleOnClickNewPosting}
                    >
                        새 글 쓰기
                    </button>
                </Col>
            </Row>
            <Gathers handleOnClickPost={handleOnClickPost}></Gathers>
        </Container>
    );
};

export default GatherRoom;
